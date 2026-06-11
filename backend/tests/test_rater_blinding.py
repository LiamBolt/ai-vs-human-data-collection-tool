"""Rater blinding (character-level) + double-scoring assignment."""
from __future__ import annotations

import uuid

from sqlalchemy import select

from app.models import RaterScore, TaskResponse
from tests.conftest import TestSession
from tests.helpers import API, assign, check_in, submit_form0, task_payload

FORBIDDEN_TOKENS = [
    "participant_code", "group_assignment", "assistance", "confidence",
    "duration", "telemetry", "verified", "copy_used", "CONTROL", "AI_ASSISTED",
]


async def _response_with_score_flag(client, proctor, batch_id, needs_double: bool) -> uuid.UUID:
    p = await check_in(client, proctor["headers"], batch_id)
    await submit_form0(client, p["participant_code"])
    await assign(client, proctor["headers"], p["participant_id"], "AI_ASSISTED")
    r = await client.post(
        f"{API}/tasks/A1/submit",
        json=task_payload("A1", 1, "AI_ASSISTED", participant_code=p["participant_code"]),
    )
    assert r.status_code == 200
    async with TestSession() as db:
        resp = (await db.execute(select(TaskResponse).where(TaskResponse.task_code == "A1"))).scalar_one()
        resp.needs_double_score = needs_double
        await db.commit()
        return resp.id


async def test_queue_is_blinded(client, proctor, rater_a, site_and_batch):
    await _response_with_score_flag(client, proctor, site_and_batch["batch_id"], needs_double=False)
    resp = await client.get(f"{API}/rater/queue", headers=rater_a["headers"])
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert set(items[0].keys()) == {
        "response_id", "session_number", "task_code", "objective_question",
        "objective_answer", "text_justification",
    }
    # Character-level: no forbidden field/value tokens anywhere in the payload.
    raw = resp.text
    for token in FORBIDDEN_TOKENS:
        assert token not in raw, f"blinding leak: {token!r} present"


async def test_double_scoring_two_raters(client, proctor, rater_a, rater_b, site_and_batch):
    response_id = await _response_with_score_flag(client, proctor, site_and_batch["batch_id"], needs_double=True)
    score_body = {"response_id": str(response_id), "correctness": 2, "justification_quality": 2, "independence": 2}

    first = await client.post(f"{API}/rater/scores", headers=rater_a["headers"], json=score_body)
    assert first.status_code == 201

    # rater_a no longer sees it; rater_b still does (needs second score).
    assert await _queue_len(client, rater_a) == 0
    assert await _queue_len(client, rater_b) == 1

    second = await client.post(f"{API}/rater/scores", headers=rater_b["headers"], json=score_body)
    assert second.status_code == 201

    async with TestSession() as db:
        scores = (await db.execute(select(RaterScore).where(RaterScore.task_response_id == response_id))).scalars().all()
        flags = sorted(s.is_double_score for s in scores)
        assert flags == [False, True]


async def test_cannot_score_twice(client, proctor, rater_a, site_and_batch):
    response_id = await _response_with_score_flag(client, proctor, site_and_batch["batch_id"], needs_double=False)
    body = {"response_id": str(response_id), "correctness": 1, "justification_quality": 1, "independence": 1}
    assert (await client.post(f"{API}/rater/scores", headers=rater_a["headers"], json=body)).status_code == 201
    assert (await client.post(f"{API}/rater/scores", headers=rater_a["headers"], json=body)).status_code == 409


async def _queue_len(client, rater) -> int:
    resp = await client.get(f"{API}/rater/queue", headers=rater["headers"])
    return len(resp.json())
