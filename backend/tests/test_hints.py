"""Hint hard guards: group, session, sequential unlocking."""
from __future__ import annotations

from app.instruments import HINTS
from app.models import ParticipantState
from tests.conftest import TestSession
from tests.helpers import API, assign, check_in, submit_form0


async def _ai_participant(client, proctor, batch_id, group="AI_ASSISTED"):
    p = await check_in(client, proctor["headers"], batch_id)
    await submit_form0(client, p["participant_code"])
    await assign(client, proctor["headers"], p["participant_id"], group)
    return p


async def test_sequential_unlock_and_text(client, proctor, site_and_batch):
    p = await _ai_participant(client, proctor, site_and_batch["batch_id"])
    code = p["participant_code"]

    r1 = await client.post(f"{API}/hints/request", json={"participant_code": code, "task_code": "A1", "level": 1})
    assert r1.status_code == 200
    assert r1.json()["hint_text"] == HINTS["A1"][1]

    r2 = await client.post(f"{API}/hints/request", json={"participant_code": code, "task_code": "A1", "level": 2})
    assert r2.status_code == 200
    assert r2.json()["hint_text"] == HINTS["A1"][2]


async def test_level_skipping_forbidden(client, proctor, site_and_batch):
    p = await _ai_participant(client, proctor, site_and_batch["batch_id"])
    resp = await client.post(
        f"{API}/hints/request", json={"participant_code": p["participant_code"], "task_code": "A1", "level": 2}
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "HINT_OUT_OF_ORDER"


async def test_control_group_forbidden(client, proctor, site_and_batch):
    p = await _ai_participant(client, proctor, site_and_batch["batch_id"], group="CONTROL")
    resp = await client.post(
        f"{API}/hints/request", json={"participant_code": p["participant_code"], "task_code": "A1", "level": 1}
    )
    assert resp.status_code == 403


async def test_session2_forbidden(client, proctor, site_and_batch):
    p = await _ai_participant(client, proctor, site_and_batch["batch_id"])
    # Force the participant into Session 2.
    async with TestSession() as db:
        import uuid as _uuid

        state = await db.get(ParticipantState, _uuid.UUID(p["participant_id"]))
        state.current_session = 2
        await db.commit()

    resp = await client.post(
        f"{API}/hints/request", json={"participant_code": p["participant_code"], "task_code": "A1", "level": 1}
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "HINT_FORBIDDEN_S2"
