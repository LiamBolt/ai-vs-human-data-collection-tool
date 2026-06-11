"""Rater service — blinded queue assembly and score recording with double-scoring."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ConflictError, NotFoundError
from app.models import RaterScore, Task, TaskResponse
from app.modules.rater import schemas


async def queue(db: AsyncSession, rater_id: uuid.UUID, limit: int = 100) -> list[schemas.RaterQueueItem]:
    # Score counts per response.
    count_rows = (
        await db.execute(
            select(RaterScore.task_response_id, func.count())
            .group_by(RaterScore.task_response_id)
        )
    ).all()
    counts = {rid: int(c) for (rid, c) in count_rows}

    mine = {
        rid
        for (rid,) in (
            await db.execute(
                select(RaterScore.task_response_id).where(RaterScore.rater_id == rater_id)
            )
        ).all()
    }

    rows = (
        await db.execute(
            select(TaskResponse, Task.objective_question)
            .join(Task, Task.task_code == TaskResponse.task_code)
            .order_by(TaskResponse.submitted_at)
        )
    ).all()

    out: list[schemas.RaterQueueItem] = []
    for resp, question in rows:
        if resp.id in mine:
            continue
        cnt = counts.get(resp.id, 0)
        # Unscored → any rater. Flagged-for-double with exactly one score → a second, distinct rater.
        if cnt == 0 or (resp.needs_double_score and cnt == 1):
            out.append(
                schemas.RaterQueueItem(
                    response_id=resp.id,
                    session_number=resp.session_number,
                    task_code=resp.task_code,
                    objective_question=question,
                    objective_answer=resp.objective_answer,
                    text_justification=resp.text_justification,
                )
            )
        if len(out) >= limit:
            break
    return out


async def submit_score(db: AsyncSession, rater_id: uuid.UUID, payload: schemas.RaterScoreRequest) -> None:
    response = await db.get(TaskResponse, payload.response_id)
    if response is None:
        raise NotFoundError("Response not found.")

    already = (
        await db.execute(
            select(RaterScore).where(
                RaterScore.task_response_id == payload.response_id,
                RaterScore.rater_id == rater_id,
            )
        )
    ).scalar_one_or_none()
    if already is not None:
        raise ConflictError("You have already scored this response.")

    existing_count = (
        await db.execute(
            select(func.count()).select_from(RaterScore).where(
                RaterScore.task_response_id == payload.response_id
            )
        )
    ).scalar_one()

    db.add(
        RaterScore(
            task_response_id=payload.response_id,
            rater_id=rater_id,
            correctness=payload.correctness,
            justification_quality=payload.justification_quality,
            independence=payload.independence,
            is_double_score=int(existing_count) >= 1,
            scored_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()
