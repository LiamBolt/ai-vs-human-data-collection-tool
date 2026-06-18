"""Proctor / admin service: clinic setup, race-safe check-in, stratified assignment."""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums import (
    AiUseFrequency,
    AssignmentMethod,
    GroupAssignment,
    ParticipantStatus,
)
from app.exceptions import ConflictError, NotFoundError, ValidationError
from app.models import (
    Batch,
    DeviationLog,
    Layer2Log,
    Participant,
    ParticipantState,
    SessionMeta,
    Site,
    StaffUser,
    TelemetryLog,
)
from app.enums import TelemetryEventType
from app.config import settings
from app.security import proctor_presence
from app.modules.proctor import schemas


# ── Sites ─────────────────────────────────────────────────────────────────────
async def list_sites(db: AsyncSession) -> list[schemas.SiteOut]:
    rows = (await db.execute(select(Site).order_by(Site.site_code))).scalars().all()
    return [schemas.SiteOut.model_validate(r) for r in rows]


async def create_site(db: AsyncSession, payload: schemas.SiteCreate) -> schemas.SiteOut:
    exists = (
        await db.execute(select(Site).where(Site.site_code == payload.site_code))
    ).scalar_one_or_none()
    if exists is not None:
        raise ConflictError("A site with this code already exists.")
    site = Site(site_code=payload.site_code, site_name=payload.site_name)
    db.add(site)
    await db.commit()
    await db.refresh(site)
    return schemas.SiteOut.model_validate(site)


# ── Batches ───────────────────────────────────────────────────────────────────
def _batch_out(batch: Batch, site_code: str) -> schemas.BatchOut:
    return schemas.BatchOut(
        id=batch.id,
        site_id=batch.site_id,
        site_code=site_code,
        batch_code=batch.batch_code,
        clinic_date=batch.clinic_date,
        layer=batch.layer,
        timing_mode=batch.timing_mode,
        created_at=batch.created_at,
    )


async def list_batches(db: AsyncSession) -> list[schemas.BatchOut]:
    rows = (
        await db.execute(
            select(Batch, Site.site_code).join(Site, Batch.site_id == Site.id).order_by(Batch.created_at.desc())
        )
    ).all()
    return [_batch_out(b, code) for (b, code) in rows]


async def create_batch(
    db: AsyncSession, payload: schemas.BatchCreate, created_by: uuid.UUID
) -> schemas.BatchOut:
    site = await db.get(Site, payload.site_id)
    if site is None:
        raise NotFoundError("Site not found.")

    # Next batch number for this site is its existing batch count + 1.
    count = (
        await db.execute(select(func.count()).select_from(Batch).where(Batch.site_id == site.id))
    ).scalar_one()
    batch_number = int(count) + 1
    batch_code = f"{payload.clinic_date:%Y%m%d}_{site.site_code}_BATCH{batch_number:02d}"

    batch = Batch(
        site_id=site.id,
        batch_code=batch_code,
        batch_number=batch_number,
        clinic_date=payload.clinic_date,
        layer=payload.layer,
        timing_mode=payload.timing_mode,
        created_by=created_by,
    )
    db.add(batch)
    await db.commit()
    await db.refresh(batch)
    return _batch_out(batch, site.site_code)


# ── Check-in (race-safe sequential code) ──────────────────────────────────────
async def check_in(
    db: AsyncSession, payload: schemas.CheckInRequest, proctor_id: uuid.UUID
) -> schemas.CheckInResponse:
    if not payload.consent_given:
        raise ValidationError("Consent is required to check in a participant.")

    # Lock the batch row so concurrent check-ins serialize on the counter.
    batch = (
        await db.execute(select(Batch).where(Batch.id == payload.batch_id).with_for_update())
    ).scalar_one_or_none()
    if batch is None:
        raise NotFoundError("Batch not found.")

    site = await db.get(Site, batch.site_id)
    batch.participant_seq += 1
    seq = batch.participant_seq
    participant_code = f"{site.site_code}-{batch.batch_number:02d}-{seq:04d}"

    participant = Participant(
        participant_code=participant_code,
        site_id=site.id,
        batch_id=batch.id,
        proctor_id=proctor_id,
        consent_given=True,
        consent_timestamp=datetime.now(timezone.utc),
        device_category=payload.device_category,
        os_family=payload.os_family,
        browser_family=payload.browser_family,
        user_agent_raw=payload.user_agent_raw,
        status=ParticipantStatus.CHECKED_IN,
    )
    db.add(participant)
    await db.flush()

    db.add(
        ParticipantState(
            participant_id=participant.id,
            current_session=1,
            current_step="consent",
            draft_responses={},
            unsynced_telemetry=[],
        )
    )
    await db.commit()
    return schemas.CheckInResponse(participant_id=participant.id, participant_code=participant_code)


# ── Stratified assignment (B3) ────────────────────────────────────────────────
def _ai_bucket(freq: AiUseFrequency) -> str:
    return "LOW" if freq in {AiUseFrequency.NEVER, AiUseFrequency.MONTHLY} else "HIGH"


def stratum_of(participant: Participant) -> str:
    return f"{participant.education_level.value}/{_ai_bucket(participant.ai_use_frequency)}"


async def _compute_suggestion(
    db: AsyncSession, participant: Participant
) -> tuple[GroupAssignment, str, dict[str, int]]:
    """Stratified balancing: keep each (education × AI-familiarity) stratum even,
    then keep the site even, then coin-flip. Returns (group, stratum, counts)."""
    target_stratum = stratum_of(participant)

    # Tally assigned participants in the same site by (stratum, group).
    others = (
        await db.execute(
            select(Participant).where(
                Participant.site_id == participant.site_id,
                Participant.group_assignment.is_not(None),
                Participant.education_level.is_not(None),
                Participant.ai_use_frequency.is_not(None),
            )
        )
    ).scalars().all()

    counts: dict[str, int] = {}
    stratum_group: dict[tuple[str, GroupAssignment], int] = {}
    overall: dict[GroupAssignment, int] = {GroupAssignment.CONTROL: 0, GroupAssignment.AI_ASSISTED: 0}
    for other in others:
        s = stratum_of(other)
        g = other.group_assignment
        key = f"{s} / {g.value}"
        counts[key] = counts.get(key, 0) + 1
        stratum_group[(s, g)] = stratum_group.get((s, g), 0) + 1
        overall[g] += 1

    control_in = stratum_group.get((target_stratum, GroupAssignment.CONTROL), 0)
    ai_in = stratum_group.get((target_stratum, GroupAssignment.AI_ASSISTED), 0)

    if control_in < ai_in:
        suggested = GroupAssignment.CONTROL
    elif ai_in < control_in:
        suggested = GroupAssignment.AI_ASSISTED
    elif overall[GroupAssignment.CONTROL] < overall[GroupAssignment.AI_ASSISTED]:
        suggested = GroupAssignment.CONTROL
    elif overall[GroupAssignment.AI_ASSISTED] < overall[GroupAssignment.CONTROL]:
        suggested = GroupAssignment.AI_ASSISTED
    else:
        suggested = random.choice([GroupAssignment.CONTROL, GroupAssignment.AI_ASSISTED])

    return suggested, target_stratum, counts


async def assignment_suggestion(
    db: AsyncSession, participant_id: uuid.UUID
) -> schemas.AssignmentSuggestion:
    participant = await db.get(Participant, participant_id)
    if participant is None:
        raise NotFoundError("Participant not found.")
    if participant.education_level is None or participant.ai_use_frequency is None:
        # Stratification needs Form 0 — not available yet.
        raise ConflictError("Form 0 is not complete yet.", code="FORM0_INCOMPLETE")

    suggested, target_stratum, counts = await _compute_suggestion(db, participant)
    return schemas.AssignmentSuggestion(
        participant_id=participant.id,
        suggested_group=suggested,
        stratum=target_stratum,
        current_counts=counts,
    )


async def _apply_assignment(
    db: AsyncSession,
    participant: Participant,
    group: GroupAssignment,
    method: AssignmentMethod,
    *,
    auto: bool = False,
) -> None:
    """Set the group and advance the participant into Session 1. Does NOT commit."""
    participant.group_assignment = group
    participant.assignment_method = method
    participant.auto_assigned = auto
    participant.status = ParticipantStatus.SESSION1

    state = await db.get(ParticipantState, participant.id)
    if state is not None:
        state.current_session = 1
        state.current_step = "s1_intro"

    # Open the Session 1 record.
    existing_meta = (
        await db.execute(
            select(SessionMeta).where(
                SessionMeta.participant_id == participant.id, SessionMeta.session_number == 1
            )
        )
    ).scalar_one_or_none()
    if existing_meta is None:
        db.add(
            SessionMeta(
                participant_id=participant.id,
                session_number=1,
                started_at=datetime.now(timezone.utc),
            )
        )


async def set_assignment(
    db: AsyncSession, participant_id: uuid.UUID, payload: schemas.AssignmentRequest
) -> schemas.AssignmentSuggestion:
    participant = await db.get(Participant, participant_id)
    if participant is None:
        raise NotFoundError("Participant not found.")
    if participant.education_level is None:
        raise ConflictError("Form 0 is not complete yet.", code="FORM0_INCOMPLETE")
    if payload.method == AssignmentMethod.MANUAL_OVERRIDE and not (payload.override_reason or "").strip():
        raise ValidationError("An override reason is required for manual overrides.")

    await _apply_assignment(db, participant, payload.group, payload.method, auto=False)
    await db.commit()
    return schemas.AssignmentSuggestion(
        participant_id=participant.id,
        suggested_group=payload.group,
        stratum=stratum_of(participant),
        current_counts={},
    )


async def maybe_auto_assign(db: AsyncSession, participant: Participant) -> bool:
    """Auto-assign a participant who is awaiting a group when no proctor handles it.

    With no recently-active proctor the server assigns immediately; while a
    proctor is active they get `assignment_grace_seconds` to assign manually
    first. Uses the same stratified balancing as the manual suggestion and is
    recorded with `auto_assigned=True`. Does NOT commit. Returns True if assigned.
    """
    if participant.group_assignment is not None:
        return False
    if participant.status != ParticipantStatus.FORM0:
        return False
    if participant.education_level is None or participant.ai_use_frequency is None:
        return False  # Form 0 not actually complete

    now = datetime.now(timezone.utc)
    if participant.form0_completed_at is None:
        participant.form0_completed_at = now  # backfill rows predating this feature

    if proctor_presence.is_active(settings.proctor_presence_seconds):
        elapsed = (now - participant.form0_completed_at).total_seconds()
        if elapsed < settings.assignment_grace_seconds:
            return False  # within the grace window — let the proctor assign

    group, _, _ = await _compute_suggestion(db, participant)
    await _apply_assignment(db, participant, group, AssignmentMethod.SUGGESTED_ACCEPTED, auto=True)
    return True


async def awaiting_assignment_count(db: AsyncSession) -> int:
    """Participants who finished Form 0 but have no group yet (the proctor to-do)."""
    return int(
        (
            await db.execute(
                select(func.count())
                .select_from(Participant)
                .where(
                    Participant.status == ParticipantStatus.FORM0,
                    Participant.group_assignment.is_(None),
                )
            )
        ).scalar_one()
    )


# ── Warm-up override ──────────────────────────────────────────────────────────
async def override_warmup(db: AsyncSession, participant_id: uuid.UUID, score: int) -> None:
    participant = await db.get(Participant, participant_id)
    if participant is None:
        raise NotFoundError("Participant not found.")
    participant.warmup_final_score = score
    participant.warmup_score_overridden = True
    await db.commit()


# ── Deviations / Layer 2 ──────────────────────────────────────────────────────
async def create_deviation(
    db: AsyncSession, payload: schemas.DeviationRequest, proctor_id: uuid.UUID
) -> None:
    db.add(
        DeviationLog(
            batch_id=payload.batch_id,
            participant_id=payload.participant_id,
            proctor_id=proctor_id,
            description=payload.description,
        )
    )
    await db.commit()


async def create_layer2(
    db: AsyncSession, payload: schemas.Layer2Request, entered_by: uuid.UUID
) -> None:
    exists = (
        await db.execute(select(Layer2Log).where(Layer2Log.participant_id == payload.participant_id))
    ).scalar_one_or_none()
    if exists is not None:
        raise ConflictError("A Layer 2 log already exists for this participant.")
    db.add(
        Layer2Log(
            participant_id=payload.participant_id,
            prompt_log_id=payload.prompt_log_id,
            model_name_shown=payload.model_name_shown,
            prompt_count=payload.prompt_count,
            time_in_tool_minutes=payload.time_in_tool_minutes,
            copy_similarity_note=payload.copy_similarity_note,
            entered_by=entered_by,
        )
    )
    await db.commit()


# ── Monitor ───────────────────────────────────────────────────────────────────
async def monitor(db: AsyncSession, batch_id: uuid.UUID) -> list[schemas.MonitorRow]:
    rows = (
        await db.execute(
            select(Participant, ParticipantState)
            .join(ParticipantState, ParticipantState.participant_id == Participant.id, isouter=True)
            .where(Participant.batch_id == batch_id)
            .order_by(Participant.participant_code)
        )
    ).all()

    # Infraction counts per participant in one query.
    infraction_rows = (
        await db.execute(
            select(TelemetryLog.participant_id, func.count())
            .where(TelemetryLog.event_type == TelemetryEventType.INFRACTION)
            .group_by(TelemetryLog.participant_id)
        )
    ).all()
    infractions = {pid: int(c) for (pid, c) in infraction_rows}

    now = datetime.now(timezone.utc)
    out: list[schemas.MonitorRow] = []
    for participant, state in rows:
        if state is not None and state.updated_at is not None:
            age = int((now - state.updated_at).total_seconds())
        else:
            age = 0
        out.append(
            schemas.MonitorRow(
                participant_id=participant.id,
                participant_code=participant.participant_code,
                status=participant.status,
                current_step=state.current_step if state else "consent",
                last_sync_age_seconds=max(age, 0),
                infraction_count=infractions.get(participant.id, 0),
                warmup_score=participant.warmup_final_score,
                warmup_score_overridden=participant.warmup_score_overridden,
                group_assignment=participant.group_assignment,
            )
        )
    return out
