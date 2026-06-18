"""Participant-flow service — the server-side source of truth for every rule."""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.enums import (
    GroupAssignment,
    ParticipantStatus,
    TelemetryEventType,
)
from app.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.instruments import (
    HINTS,
    SESSION1_TASK_CODES,
    SESSION2_TASK_CODES,
    TASKS_BY_CODE,
    expected_scale_items,
)
from app.models import (
    HintEvent,
    Participant,
    ParticipantState,
    ScaleResponse,
    SessionMeta,
    Task,
    TaskResponse,
)
from app.modules.session import repository as repo
from app.modules.session import schemas

AI_COLUMN_FIELDS = (
    "assistance_level",
    "requests_count",
    "copy_used",
    "verified",
    "verification_method",
    "verification_method_other",
    "verification_evidence",
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _task_out(db: AsyncSession, task_code: str) -> schemas.PublicTaskOut | None:
    task = (await db.execute(select(Task).where(Task.task_code == task_code))).scalar_one_or_none()
    if task is None:
        return None
    return schemas.PublicTaskOut(
        id=task.id,
        task_code=task.task_code,
        session_number=task.session_number,
        display_order=task.display_order,
        family=task.family,
        objective_question=task.objective_question,
        justification_prompt=task.justification_prompt,
        answer_type=task.answer_type,
        parallel_to=task.parallel_to,
    )


def _task_code_from_step(step: str) -> str | None:
    if step.startswith("s1_task_"):
        return step[len("s1_task_"):]
    if step.startswith("s2_task_"):
        return step[len("s2_task_"):]
    return None


async def _resolve_task_step(db: AsyncSession, participant: Participant, step: str) -> str:
    """Self-heal a task step against what is actually submitted.

    If `step` points at a task, return the step for the first task in that
    session that has NOT been submitted yet (or the post-session step if all
    are done). Non-task steps pass through untouched. This guarantees the
    server's step can never sit on, or be pushed backward onto, a completed
    task — so a stale client sync or a resume can never strand a participant on
    an already-submitted task (which would only ever return 409).
    """
    if step.startswith("s1_task_"):
        prefix, order, session_number, after_step = "s1_task_", SESSION1_TASK_CODES, 1, "s1_scales"
    elif step.startswith("s2_task_"):
        prefix, order, session_number, after_step = "s2_task_", SESSION2_TASK_CODES, 2, "s2_transfer"
    else:
        return step

    submitted = set(
        (
            await db.execute(
                select(TaskResponse.task_code).where(
                    TaskResponse.participant_id == participant.id,
                    TaskResponse.session_number == session_number,
                )
            )
        )
        .scalars()
        .all()
    )
    for code in order:
        if code not in submitted:
            return f"{prefix}{code}"
    return after_step


# ── Resume ────────────────────────────────────────────────────────────────────
async def resume(db: AsyncSession, payload: schemas.ResumeRequest) -> schemas.ResumeResponse:
    participant = await repo.require_participant_by_code(db, payload.participant_code.strip())
    state = await repo.get_state(db, participant.id)
    if state is None:
        state = ParticipantState(
            participant_id=participant.id, current_session=1, current_step="consent"
        )
        db.add(state)
        await db.commit()

    # Auto-assign a group if the participant is waiting and no proctor handles it
    # in time. The participant's own resume poll is the trigger (no background job
    # needed). Lives in the proctor service; local import avoids an import cycle.
    if participant.status == ParticipantStatus.FORM0 and participant.group_assignment is None:
        from app.modules.proctor import service as proctor_service

        await proctor_service.maybe_auto_assign(db, participant)
        await db.commit()  # persists the assignment (or the form0_completed_at backfill)

    # Heal a stale/backward step (e.g. left on an already-submitted task) so the
    # participant always resumes on the first task they still need to do.
    healed = await _resolve_task_step(db, participant, state.current_step)
    if healed != state.current_step:
        state.current_step = healed
        await db.commit()

    current_task = None
    code = _task_code_from_step(state.current_step)
    if code is not None:
        current_task = await _task_out(db, code)

    # Restore assistance progress so the panel survives a refresh (otherwise the
    # client re-requests already-unlocked levels and the server returns 403).
    hint_rows = (
        await db.execute(
            select(HintEvent.task_code, func.max(HintEvent.level), func.count())
            .where(HintEvent.participant_id == participant.id)
            .group_by(HintEvent.task_code)
        )
    ).all()
    hint_progress: dict[str, schemas.HintTaskProgress] = {}
    for task_code, max_level, count in hint_rows:
        lvl = int(max_level)
        task_hints = HINTS.get(task_code, {})
        hint_progress[task_code] = schemas.HintTaskProgress(
            unlocked_level=lvl,
            request_count=int(count),
            hints={i: task_hints[i] for i in range(1, lvl + 1) if i in task_hints},
        )

    return schemas.ResumeResponse(
        participant_code=participant.participant_code,
        status=participant.status,
        current_step=state.current_step,
        group_assignment=participant.group_assignment,
        current_session=state.current_session,
        draft_responses=state.draft_responses or {},
        break_ends_at=state.break_ends_at,
        current_task=current_task,
        hint_progress=hint_progress,
    )


# ── State sync ────────────────────────────────────────────────────────────────
async def sync_state(db: AsyncSession, payload: schemas.StateSyncRequest) -> None:
    participant = await repo.require_participant_by_code(db, payload.participant_code)
    state = await repo.get_state(db, participant.id)
    if state is None:
        raise NotFoundError("Participant state not found.")

    # Never let a background sync push the step onto an already-completed task.
    state.current_step = await _resolve_task_step(db, participant, payload.current_step)
    state.draft_responses = payload.draft_responses or {}

    await repo.persist_telemetry(
        db,
        participant.id,
        [e.model_dump() for e in payload.telemetry_batch],
    )
    await db.commit()


# ── Form 0 ────────────────────────────────────────────────────────────────────
async def submit_form0(db: AsyncSession, payload: schemas.Form0Request) -> schemas.Form0Response:
    from app.scoring import score_warmup  # local import to avoid cycle at import time

    participant = await repo.require_participant_by_code(db, payload.participant_code)
    if participant.status not in (ParticipantStatus.CHECKED_IN, ParticipantStatus.FORM0):
        raise ConflictError("Form 0 cannot be submitted at this stage.")

    participant.age_band = payload.age_band
    participant.education_level = payload.education_level
    participant.english_comfort = payload.english_comfort
    participant.ai_use_frequency = payload.ai_use_frequency
    participant.ai_confidence = payload.ai_confidence
    participant.warmup_b01_answer = payload.warmup_b01_answer
    participant.warmup_b02_answer = payload.warmup_b02_answer
    participant.warmup_b03_answer = payload.warmup_b03_answer
    participant.warmup_b04_answer = payload.warmup_b04_answer

    auto = score_warmup(
        payload.warmup_b01_answer,
        payload.warmup_b02_answer,
        payload.warmup_b03_answer,
        payload.warmup_b04_answer,
    )
    participant.warmup_auto_score = auto
    if not participant.warmup_score_overridden:
        participant.warmup_final_score = auto
    participant.status = ParticipantStatus.FORM0
    participant.form0_completed_at = _now()  # starts the proctor grace window

    state = await repo.get_state(db, participant.id)
    if state is not None:
        state.current_step = "waiting_assignment"

    await db.commit()
    return schemas.Form0Response(warmup_auto_score=auto)


# ── Task submit ───────────────────────────────────────────────────────────────
def _next_step_after(session_number: int, task_code: str) -> tuple[str, bool]:
    """Return (next_step, session_complete) after submitting `task_code`."""
    if session_number == 1:
        order = SESSION1_TASK_CODES
        idx = order.index(task_code)
        if idx < len(order) - 1:
            return f"s1_task_{order[idx + 1]}", False
        return "s1_scales", True
    order = SESSION2_TASK_CODES
    idx = order.index(task_code)
    if idx < len(order) - 1:
        return f"s2_task_{order[idx + 1]}", False
    return "s2_transfer", True


async def submit_task(
    db: AsyncSession, task_code: str, payload: schemas.TaskSubmitRequest
) -> schemas.TaskSubmitResponse:
    from app.scoring import score_objective

    if task_code != payload.task_code:
        raise ValidationError("Task code in URL and body must match.")

    task_meta = TASKS_BY_CODE.get(task_code)
    if task_meta is None:
        raise NotFoundError("Unknown task.")
    if task_meta["session_number"] != payload.session_number:
        raise ValidationError("Session number does not match this task.")

    participant = await repo.require_participant_by_code(db, payload.participant_code)
    is_ai_s1 = (
        participant.group_assignment == GroupAssignment.AI_ASSISTED
        and payload.session_number == 1
    )

    # Justification ≥ 30 non-whitespace chars.
    if len("".join(payload.text_justification.split())) < 30:
        raise ValidationError(
            "Please provide a brief explanation of your reasoning (minimum 30 characters).",
            details={"field": "text_justification"},
        )

    # AI columns must be NULL unless AI-assisted AND session 1.
    has_ai_values = any(getattr(payload, f) is not None for f in AI_COLUMN_FIELDS)
    if has_ai_values and not is_ai_s1:
        raise ForbiddenError("Assistance fields are not permitted for this participant/session.")

    # Verification evidence required when verified is true.
    if is_ai_s1 and payload.verified and not (payload.verification_evidence or "").strip():
        raise ValidationError(
            "Please add one sentence of verification evidence.",
            details={"field": "verification_evidence"},
        )

    # Task ordering — all earlier tasks in this session must already be submitted.
    order = SESSION1_TASK_CODES if payload.session_number == 1 else SESSION2_TASK_CODES
    position = order.index(task_code)
    if position > 0:
        done = (
            await db.execute(
                select(func.count())
                .select_from(TaskResponse)
                .where(
                    TaskResponse.participant_id == participant.id,
                    TaskResponse.session_number == payload.session_number,
                    TaskResponse.task_code.in_(order[:position]),
                )
            )
        ).scalar_one()
        if int(done) < position:
            raise ConflictError("Tasks must be completed in order.", code="OUT_OF_ORDER")

    # Duplicate submission.
    existing = (
        await db.execute(
            select(TaskResponse).where(
                TaskResponse.participant_id == participant.id,
                TaskResponse.session_number == payload.session_number,
                TaskResponse.task_code == task_code,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError("This task has already been submitted.", code="DUPLICATE_SUBMIT")

    auto_correct = score_objective(task_meta, payload.objective_answer)
    needs_double = random.random() < settings.double_score_probability

    response = TaskResponse(
        participant_id=participant.id,
        session_number=payload.session_number,
        task_code=task_code,
        objective_answer=payload.objective_answer,
        objective_auto_correct=auto_correct,
        text_justification=payload.text_justification,
        task_familiarity=payload.task_familiarity,
        self_check=payload.self_check,
        confidence_rating=payload.confidence_rating,
        control_compliance=payload.control_compliance if not is_ai_s1 else None,
        assistance_level=payload.assistance_level if is_ai_s1 else None,
        requests_count=payload.requests_count if is_ai_s1 else None,
        copy_used=payload.copy_used if is_ai_s1 else None,
        verified=payload.verified if is_ai_s1 else None,
        verification_method=payload.verification_method if is_ai_s1 else None,
        verification_method_other=payload.verification_method_other if is_ai_s1 else None,
        verification_evidence=payload.verification_evidence if is_ai_s1 else None,
        duration_objective_ms=payload.duration_objective_ms,
        duration_justification_ms=payload.duration_justification_ms,
        duration_total_ms=payload.duration_total_ms,
        answer_change_count=payload.answer_change_count,
        participant_notes=payload.participant_notes,
        submitted_at=_now(),
        needs_double_score=needs_double,
    )
    db.add(response)

    await repo.persist_telemetry(
        db, participant.id, [e.model_dump() for e in payload.telemetry_batch]
    )

    next_step, session_complete = _next_step_after(payload.session_number, task_code)
    state = await repo.get_state(db, participant.id)
    if state is not None:
        state.current_step = next_step
        state.current_session = payload.session_number
    participant.status = (
        ParticipantStatus.SESSION1 if payload.session_number == 1 else ParticipantStatus.SESSION2
    )

    await db.commit()
    return schemas.TaskSubmitResponse(next_step=next_step, session_complete=session_complete)


# ── Hints ─────────────────────────────────────────────────────────────────────
async def _audit_infraction(db: AsyncSession, participant: Participant, task_code: str, detail: str) -> None:
    await repo.persist_telemetry(
        db,
        participant.id,
        [
            {
                "client_event_id": uuid.uuid4(),
                "event_type": TelemetryEventType.INFRACTION,
                "task_code": task_code,
                "session_number": 2,
                "client_timestamp_ms": int(_now().timestamp() * 1000),
                "event_metadata": {"kind": "forbidden_hint", "detail": detail},
            }
        ],
    )
    await db.commit()


async def request_hint(db: AsyncSession, payload: schemas.HintRequest) -> schemas.HintResponse:
    participant = await repo.require_participant_by_code(db, payload.participant_code)
    state = await repo.get_state(db, participant.id)
    current_session = state.current_session if state else 1

    # HARD GUARDS.
    if participant.group_assignment != GroupAssignment.AI_ASSISTED:
        raise ForbiddenError("Assistance is not available for this participant.", code="HINT_FORBIDDEN")
    if current_session != 1:
        await _audit_infraction(db, participant, payload.task_code, "hint_in_session_2")
        raise ForbiddenError("Assistance is removed in Session 2.", code="HINT_FORBIDDEN_S2")
    if payload.task_code not in SESSION1_TASK_CODES:
        raise ForbiddenError("Assistance is not available for this task.", code="HINT_FORBIDDEN")

    unlocked = (
        await db.execute(
            select(func.coalesce(func.max(HintEvent.level), 0)).where(
                HintEvent.participant_id == participant.id,
                HintEvent.task_code == payload.task_code,
            )
        )
    ).scalar_one()
    # Skipping ahead past the next level is forbidden. Re-requesting a level that
    # is already unlocked (e.g. after a refresh restored the panel) just returns
    # the text again — no new HintEvent, no inflated request count.
    if payload.level > int(unlocked) + 1:
        raise ForbiddenError("Assistance levels must be unlocked in order.", code="HINT_OUT_OF_ORDER")

    hint_text = HINTS.get(payload.task_code, {}).get(payload.level)
    if hint_text is None:
        raise NotFoundError("Hint not found.")

    if payload.level <= int(unlocked):
        return schemas.HintResponse(hint_text=hint_text, level=payload.level, task_code=payload.task_code)

    request_number = (
        await db.execute(
            select(func.count()).select_from(HintEvent).where(
                HintEvent.participant_id == participant.id,
                HintEvent.task_code == payload.task_code,
            )
        )
    ).scalar_one() + 1

    db.add(
        HintEvent(
            participant_id=participant.id,
            task_code=payload.task_code,
            level=payload.level,
            request_number=int(request_number),
        )
    )
    await repo.persist_telemetry(
        db,
        participant.id,
        [
            {
                "client_event_id": uuid.uuid4(),
                "event_type": TelemetryEventType.HINT_UNLOCK,
                "task_code": payload.task_code,
                "session_number": 1,
                "client_timestamp_ms": int(_now().timestamp() * 1000),
                "event_metadata": {"level": payload.level, "request_number": int(request_number)},
            }
        ],
    )
    await db.commit()
    return schemas.HintResponse(hint_text=hint_text, level=payload.level, task_code=payload.task_code)


# ── Break ─────────────────────────────────────────────────────────────────────
async def start_break(db: AsyncSession, payload: schemas.BreakStartRequest) -> schemas.BreakStartResponse:
    participant = await repo.require_participant_by_code(db, payload.participant_code)
    state = await repo.get_state(db, participant.id)
    if state is None:
        raise NotFoundError("Participant state not found.")

    if state.break_ends_at is None:
        state.break_ends_at = _now() + timedelta(seconds=settings.break_duration_seconds)
    participant.status = ParticipantStatus.BREAK
    state.current_step = "break"
    await repo.persist_telemetry(
        db,
        participant.id,
        [
            {
                "client_event_id": uuid.uuid4(),
                "event_type": TelemetryEventType.BREAK_START,
                "task_code": None,
                "session_number": 1,
                "client_timestamp_ms": int(_now().timestamp() * 1000),
                "event_metadata": {},
            }
        ],
    )
    await db.commit()
    return schemas.BreakStartResponse(break_ends_at=state.break_ends_at)


async def break_status(db: AsyncSession, participant_code: str) -> schemas.BreakStatusResponse:
    participant = await repo.require_participant_by_code(db, participant_code)
    state = await repo.get_state(db, participant.id)
    if state is None:
        raise NotFoundError("Participant state not found.")
    if state.break_ends_at is None:
        state.break_ends_at = _now() + timedelta(seconds=settings.break_duration_seconds)
        await db.commit()
    remaining = max(0, int((state.break_ends_at - _now()).total_seconds()))
    return schemas.BreakStatusResponse(remaining_seconds=remaining, break_ends_at=state.break_ends_at)


async def complete_break(db: AsyncSession, payload: schemas.BreakCompleteRequest) -> None:
    participant = await repo.require_participant_by_code(db, payload.participant_code)
    state = await repo.get_state(db, participant.id)
    if state is None or state.break_ends_at is None:
        raise ForbiddenError("Break has not started.", code="BREAK_NOT_STARTED")
    # 2-second tolerance.
    if _now() < state.break_ends_at - timedelta(seconds=2):
        raise ForbiddenError("The break is not over yet.", code="BREAK_NOT_OVER")

    participant.status = ParticipantStatus.SESSION2
    state.current_session = 2
    state.current_step = "s2_intro"

    existing = (
        await db.execute(
            select(SessionMeta).where(
                SessionMeta.participant_id == participant.id, SessionMeta.session_number == 2
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        db.add(SessionMeta(participant_id=participant.id, session_number=2, started_at=_now()))

    await repo.persist_telemetry(
        db,
        participant.id,
        [
            {
                "client_event_id": uuid.uuid4(),
                "event_type": TelemetryEventType.BREAK_END,
                "task_code": None,
                "session_number": 2,
                "client_timestamp_ms": int(_now().timestamp() * 1000),
                "event_metadata": {},
            }
        ],
    )
    await db.commit()


# ── Scales ────────────────────────────────────────────────────────────────────
async def submit_scales(db: AsyncSession, payload: schemas.ScaleSubmitRequest) -> None:
    participant = await repo.require_participant_by_code(db, payload.participant_code)
    is_ai = participant.group_assignment == GroupAssignment.AI_ASSISTED
    expected = expected_scale_items(payload.session_number, is_ai)
    provided = {item.item_code for item in payload.items}
    if provided != expected:
        raise ValidationError(
            "The submitted scale items do not match the expected set for this session.",
            details={"expected": sorted(expected), "received": sorted(provided)},
        )

    for item in payload.items:
        existing = (
            await db.execute(
                select(ScaleResponse).where(
                    ScaleResponse.participant_id == participant.id,
                    ScaleResponse.item_code == item.item_code,
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            existing.rating = item.rating
        else:
            db.add(
                ScaleResponse(
                    participant_id=participant.id,
                    session_number=payload.session_number,
                    item_code=item.item_code,
                    rating=item.rating,
                )
            )

    state = await repo.get_state(db, participant.id)
    meta = (
        await db.execute(
            select(SessionMeta).where(
                SessionMeta.participant_id == participant.id,
                SessionMeta.session_number == payload.session_number,
            )
        )
    ).scalar_one_or_none()
    if meta is not None:
        meta.ended_at = _now()

    if payload.session_number == 1:
        participant.status = ParticipantStatus.BREAK
        if state is not None:
            state.current_step = "break"
    else:
        participant.status = ParticipantStatus.COMPLETED
        if state is not None:
            state.current_step = "completed"

    await db.commit()


# ── Transfer prompt ───────────────────────────────────────────────────────────
async def submit_transfer(db: AsyncSession, payload: schemas.TransferRequest) -> None:
    if payload.used and not (payload.text or "").strip():
        raise ValidationError("Please write one line describing the method you used.")

    participant = await repo.require_participant_by_code(db, payload.participant_code)
    meta = (
        await db.execute(
            select(SessionMeta).where(
                SessionMeta.participant_id == participant.id, SessionMeta.session_number == 2
            )
        )
    ).scalar_one_or_none()
    if meta is None:
        meta = SessionMeta(participant_id=participant.id, session_number=2, started_at=_now())
        db.add(meta)
    meta.transfer_prompt_used = payload.used
    meta.transfer_prompt_text = payload.text if payload.used else None

    participant.status = ParticipantStatus.SCALES_S2
    state = await repo.get_state(db, participant.id)
    if state is not None:
        state.current_step = "scales_s2"

    await db.commit()
