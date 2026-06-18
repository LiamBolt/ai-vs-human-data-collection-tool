"""CSV export builders — tidy, pandas-friendly, anonymity-preserving.

Every export carries `participant_code` (+ session_number/task_code where applicable)
so analysts can merge in pandas. `user_agent_raw` is never emitted.
"""
from __future__ import annotations

import csv
import enum
import io
import json
from collections.abc import Iterable
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data_dictionary import DATA_DICTIONARY
from app.models import (
    Batch,
    DeviationLog,
    HintEvent,
    Layer2Log,
    Participant,
    RaterScore,
    ScaleResponse,
    SessionMeta,
    Site,
    StaffUser,
    Task,
    TaskResponse,
    TelemetryLog,
)

EXPORT_LABELS: dict[str, str] = {
    "participants": "Participants",
    "task_responses": "Task responses",
    "telemetry_events": "Telemetry events",
    "hint_events": "Hint events",
    "scale_responses": "Scale responses",
    "rater_scores": "Rater scores",
    "session_meta": "Session metadata",
    "deviation_logs": "Deviation logs",
    "layer2_logs": "Layer 2 logs",
    "data_dictionary": "Data dictionary",
}


def _cell(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, enum.Enum):
        return str(value.value)
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def render_csv(fieldnames: list[str], rows: Iterable[dict]) -> str:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({k: _cell(row.get(k)) for k in fieldnames})
    return buffer.getvalue()


# ── Lookups ───────────────────────────────────────────────────────────────────
async def _participant_code_map(db: AsyncSession) -> dict:
    return {
        pid: code
        for (pid, code) in (
            await db.execute(select(Participant.id, Participant.participant_code))
        ).all()
    }


# ── Per-export builders ───────────────────────────────────────────────────────
async def _participants(db: AsyncSession) -> tuple[list[str], list[dict]]:
    fields = [
        "participant_code", "site_code", "batch_code", "group_assignment", "assignment_method",
        "auto_assigned", "consent_given", "age_band", "education_level", "english_comfort", "ai_use_frequency",
        "ai_confidence", "warmup_auto_score", "warmup_final_score", "warmup_score_overridden",
        "device_category", "os_family", "browser_family", "status",
    ]
    rows = (
        await db.execute(
            select(Participant, Site.site_code, Batch.batch_code)
            .join(Site, Participant.site_id == Site.id)
            .join(Batch, Participant.batch_id == Batch.id)
            .order_by(Participant.participant_code)
        )
    ).all()
    out = []
    for p, site_code, batch_code in rows:
        out.append({
            "participant_code": p.participant_code, "site_code": site_code, "batch_code": batch_code,
            "group_assignment": p.group_assignment, "assignment_method": p.assignment_method,
            "auto_assigned": p.auto_assigned,
            "consent_given": p.consent_given, "age_band": p.age_band, "education_level": p.education_level,
            "english_comfort": p.english_comfort, "ai_use_frequency": p.ai_use_frequency,
            "ai_confidence": p.ai_confidence, "warmup_auto_score": p.warmup_auto_score,
            "warmup_final_score": p.warmup_final_score, "warmup_score_overridden": p.warmup_score_overridden,
            "device_category": p.device_category, "os_family": p.os_family,
            "browser_family": p.browser_family, "status": p.status,
            # user_agent_raw intentionally omitted.
        })
    return fields, out


async def _task_responses(db: AsyncSession) -> tuple[list[str], list[dict]]:
    fields = [
        "participant_code", "session_number", "task_code", "objective_answer", "objective_auto_correct",
        "text_justification", "task_familiarity", "self_check", "confidence_rating", "control_compliance",
        "assistance_level", "requests_count", "copy_used", "verified", "verification_method",
        "verification_method_other", "verification_evidence", "duration_objective_ms",
        "duration_justification_ms", "duration_total_ms", "answer_change_count", "participant_notes",
        "needs_double_score", "submitted_at",
    ]
    rows = (
        await db.execute(
            select(TaskResponse, Participant.participant_code)
            .join(Participant, TaskResponse.participant_id == Participant.id)
            .order_by(Participant.participant_code, TaskResponse.session_number, TaskResponse.task_code)
        )
    ).all()
    out = []
    for r, code in rows:
        d = {f: getattr(r, f, None) for f in fields if f != "participant_code"}
        d["participant_code"] = code
        out.append(d)
    return fields, out


async def _telemetry_events(db: AsyncSession) -> tuple[list[str], list[dict]]:
    fields = ["participant_code", "session_number", "task_code", "event_type", "event_metadata",
              "client_timestamp_ms", "created_at"]
    codes = await _participant_code_map(db)
    rows = (await db.execute(select(TelemetryLog).order_by(TelemetryLog.id))).scalars().all()
    out = [{
        "participant_code": codes.get(t.participant_id, ""), "session_number": t.session_number,
        "task_code": t.task_code, "event_type": t.event_type, "event_metadata": t.event_metadata,
        "client_timestamp_ms": t.client_timestamp_ms, "created_at": t.created_at,
    } for t in rows]
    return fields, out


async def _hint_events(db: AsyncSession) -> tuple[list[str], list[dict]]:
    fields = ["participant_code", "task_code", "level", "request_number", "viewed_duration_ms", "copied"]
    codes = await _participant_code_map(db)
    rows = (await db.execute(select(HintEvent).order_by(HintEvent.created_at))).scalars().all()
    out = [{
        "participant_code": codes.get(h.participant_id, ""), "task_code": h.task_code, "level": h.level,
        "request_number": h.request_number, "viewed_duration_ms": h.viewed_duration_ms, "copied": h.copied,
    } for h in rows]
    return fields, out


async def _scale_responses(db: AsyncSession) -> tuple[list[str], list[dict]]:
    fields = ["participant_code", "session_number", "item_code", "rating"]
    codes = await _participant_code_map(db)
    rows = (await db.execute(select(ScaleResponse).order_by(ScaleResponse.item_code))).scalars().all()
    out = [{
        "participant_code": codes.get(s.participant_id, ""), "session_number": s.session_number,
        "item_code": s.item_code, "rating": s.rating,
    } for s in rows]
    return fields, out


async def _rater_scores(db: AsyncSession) -> tuple[list[str], list[dict]]:
    fields = ["participant_code", "session_number", "task_code", "rater_display_code",
              "correctness", "justification_quality", "independence", "is_double_score"]
    rows = (
        await db.execute(
            select(RaterScore, TaskResponse, Participant.participant_code, StaffUser.display_code)
            .join(TaskResponse, RaterScore.task_response_id == TaskResponse.id)
            .join(Participant, TaskResponse.participant_id == Participant.id)
            .join(StaffUser, RaterScore.rater_id == StaffUser.id)
            .order_by(Participant.participant_code)
        )
    ).all()
    out = [{
        "participant_code": code, "session_number": tr.session_number, "task_code": tr.task_code,
        "rater_display_code": rater_code, "correctness": rs.correctness,
        "justification_quality": rs.justification_quality, "independence": rs.independence,
        "is_double_score": rs.is_double_score,
    } for (rs, tr, code, rater_code) in rows]
    return fields, out


async def _session_meta(db: AsyncSession) -> tuple[list[str], list[dict]]:
    fields = ["participant_code", "session_number", "started_at", "ended_at",
              "transfer_prompt_used", "transfer_prompt_text"]
    codes = await _participant_code_map(db)
    rows = (await db.execute(select(SessionMeta).order_by(SessionMeta.session_number))).scalars().all()
    out = [{
        "participant_code": codes.get(m.participant_id, ""), "session_number": m.session_number,
        "started_at": m.started_at, "ended_at": m.ended_at,
        "transfer_prompt_used": m.transfer_prompt_used, "transfer_prompt_text": m.transfer_prompt_text,
    } for m in rows]
    return fields, out


async def _deviation_logs(db: AsyncSession) -> tuple[list[str], list[dict]]:
    fields = ["participant_code", "batch_code", "proctor_display_code", "description", "created_at"]
    codes = await _participant_code_map(db)
    rows = (
        await db.execute(
            select(DeviationLog, Batch.batch_code, StaffUser.display_code)
            .join(Batch, DeviationLog.batch_id == Batch.id)
            .join(StaffUser, DeviationLog.proctor_id == StaffUser.id)
            .order_by(DeviationLog.created_at)
        )
    ).all()
    out = [{
        "participant_code": codes.get(d.participant_id, "") if d.participant_id else "",
        "batch_code": batch_code, "proctor_display_code": proctor_code,
        "description": d.description, "created_at": d.created_at,
    } for (d, batch_code, proctor_code) in rows]
    return fields, out


async def _layer2_logs(db: AsyncSession) -> tuple[list[str], list[dict]]:
    fields = ["participant_code", "prompt_log_id", "model_name_shown", "prompt_count",
              "time_in_tool_minutes", "copy_similarity_note"]
    codes = await _participant_code_map(db)
    rows = (await db.execute(select(Layer2Log).order_by(Layer2Log.created_at))).scalars().all()
    out = [{
        "participant_code": codes.get(l.participant_id, ""), "prompt_log_id": l.prompt_log_id,
        "model_name_shown": l.model_name_shown, "prompt_count": l.prompt_count,
        "time_in_tool_minutes": l.time_in_tool_minutes, "copy_similarity_note": l.copy_similarity_note,
    } for l in rows]
    return fields, out


def _data_dictionary() -> tuple[list[str], list[dict]]:
    fields = ["export", "column", "type", "allowed_values", "description"]
    return fields, list(DATA_DICTIONARY)


_BUILDERS = {
    "participants": _participants,
    "task_responses": _task_responses,
    "telemetry_events": _telemetry_events,
    "hint_events": _hint_events,
    "scale_responses": _scale_responses,
    "rater_scores": _rater_scores,
    "session_meta": _session_meta,
    "deviation_logs": _deviation_logs,
    "layer2_logs": _layer2_logs,
}


async def build_export(db: AsyncSession, name: str) -> tuple[list[str], list[dict]]:
    if name == "data_dictionary":
        return _data_dictionary()
    builder = _BUILDERS.get(name)
    if builder is None:
        return [], []
    return await builder(db)


async def export_csv(db: AsyncSession, name: str) -> str | None:
    if name not in EXPORT_LABELS:
        return None
    fields, rows = await build_export(db, name)
    return render_csv(fields, rows)


async def export_meta(db: AsyncSession) -> list[dict]:
    out = []
    for name, label in EXPORT_LABELS.items():
        _, rows = await build_export(db, name)
        out.append({"name": name, "label": label, "row_count": len(rows)})
    return out
