"""Task-submit validation matrix + ordering + auto-correct."""
from __future__ import annotations

from sqlalchemy import select

from app.models import Participant, TaskResponse
from tests.conftest import TestSession
from tests.helpers import API, assign, check_in, submit_form0, task_payload


async def _ready_participant(client, proctor, batch_id, group="AI_ASSISTED"):
    p = await check_in(client, proctor["headers"], batch_id)
    await submit_form0(client, p["participant_code"])
    await assign(client, proctor["headers"], p["participant_id"], group)
    return p


async def test_short_justification_rejected(client, proctor, site_and_batch):
    p = await _ready_participant(client, proctor, site_and_batch["batch_id"])
    payload = task_payload("A1", 1, "AI_ASSISTED", participant_code=p["participant_code"], text_justification="too short")
    resp = await client.post(f"{API}/tasks/A1/submit", json=payload)
    assert resp.status_code == 422


async def test_verified_without_evidence_rejected(client, proctor, site_and_batch):
    p = await _ready_participant(client, proctor, site_and_batch["batch_id"])
    payload = task_payload(
        "A1", 1, "AI_ASSISTED", participant_code=p["participant_code"],
        verified=True, verification_method="RECOMPUTE", verification_evidence="",
    )
    resp = await client.post(f"{API}/tasks/A1/submit", json=payload)
    assert resp.status_code == 422


async def test_ai_columns_from_control_forbidden(client, proctor, site_and_batch):
    p = await _ready_participant(client, proctor, site_and_batch["batch_id"], group="CONTROL")
    payload = task_payload("A1", 1, "CONTROL", participant_code=p["participant_code"])
    payload["assistance_level"] = 2  # control must not send AI columns
    resp = await client.post(f"{API}/tasks/A1/submit", json=payload)
    assert resp.status_code == 403


async def test_out_of_order_rejected(client, proctor, site_and_batch):
    p = await _ready_participant(client, proctor, site_and_batch["batch_id"])
    resp = await client.post(
        f"{API}/tasks/A2/submit",
        json=task_payload("A2", 1, "AI_ASSISTED", participant_code=p["participant_code"]),
    )
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "OUT_OF_ORDER"


async def test_duplicate_submit_rejected(client, proctor, site_and_batch):
    p = await _ready_participant(client, proctor, site_and_batch["batch_id"])
    payload = task_payload("A1", 1, "AI_ASSISTED", participant_code=p["participant_code"])
    first = await client.post(f"{API}/tasks/A1/submit", json=payload)
    assert first.status_code == 200
    second = await client.post(f"{API}/tasks/A1/submit", json=payload)
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "DUPLICATE_SUBMIT"


async def test_happy_path_advances_and_autocorrects(client, proctor, site_and_batch):
    p = await _ready_participant(client, proctor, site_and_batch["batch_id"])
    resp = await client.post(
        f"{API}/tasks/A1/submit",
        json=task_payload("A1", 1, "AI_ASSISTED", participant_code=p["participant_code"]),
    )
    assert resp.status_code == 200
    assert resp.json() == {"next_step": "s1_task_A2", "session_complete": False}

    async with TestSession() as db:
        resp_row = (
            await db.execute(
                select(TaskResponse).where(TaskResponse.task_code == "A1")
            )
        ).scalar_one()
        assert resp_row.objective_auto_correct is True


async def test_c2_combined_answer_autocorrect(client, proctor, site_and_batch):
    p = await _ready_participant(client, proctor, site_and_batch["batch_id"])
    code = p["participant_code"]
    # Complete A1..C1 in order, then C2 with the WEEKLY|5000 combined answer.
    for tc in ["A1", "A2", "B1", "B2", "C1"]:
        r = await client.post(f"{API}/tasks/{tc}/submit", json=task_payload(tc, 1, "AI_ASSISTED", participant_code=code))
        assert r.status_code == 200
    r = await client.post(f"{API}/tasks/C2/submit", json=task_payload("C2", 1, "AI_ASSISTED", participant_code=code))
    assert r.status_code == 200
    assert r.json()["session_complete"] is True

    async with TestSession() as db:
        c2 = (await db.execute(select(TaskResponse).where(TaskResponse.task_code == "C2"))).scalar_one()
        assert c2.objective_auto_correct is True
