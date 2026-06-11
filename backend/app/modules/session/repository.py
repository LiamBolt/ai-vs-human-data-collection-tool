"""Session repository — participant lookups and idempotent telemetry persistence."""
from __future__ import annotations

import uuid
from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError
from app.models import Participant, ParticipantState, TelemetryLog


async def get_participant_by_code(db: AsyncSession, code: str) -> Participant | None:
    return (
        await db.execute(select(Participant).where(Participant.participant_code == code))
    ).scalar_one_or_none()


async def require_participant_by_code(db: AsyncSession, code: str) -> Participant:
    participant = await get_participant_by_code(db, code)
    if participant is None:
        raise NotFoundError("Participant not found.", code="PARTICIPANT_NOT_FOUND")
    return participant


async def get_state(db: AsyncSession, participant_id: uuid.UUID) -> ParticipantState | None:
    return await db.get(ParticipantState, participant_id)


async def persist_telemetry(
    db: AsyncSession,
    participant_id: uuid.UUID,
    events: Iterable[dict],
) -> int:
    """Insert telemetry rows, deduplicating on client_event_id (idempotent re-sync).

    `events` items carry: client_event_id, event_type, task_code, session_number,
    client_timestamp_ms, event_metadata. Returns the count of rows actually inserted.
    """
    rows = []
    for e in events:
        rows.append(
            {
                "client_event_id": uuid.UUID(str(e["client_event_id"])),
                "participant_id": participant_id,
                "session_number": int(e["session_number"]),
                "task_code": e.get("task_code"),
                "event_type": e["event_type"],
                "event_metadata": e.get("event_metadata") or {},
                "client_timestamp_ms": int(e["client_timestamp_ms"]),
            }
        )
    if not rows:
        return 0
    stmt = pg_insert(TelemetryLog).values(rows)
    stmt = stmt.on_conflict_do_nothing(index_elements=["client_event_id"])
    result = await db.execute(stmt)
    return result.rowcount or 0
