"""Break anchoring: cannot complete before time, can after."""
from __future__ import annotations

import asyncio

from app.instruments import expected_scale_items
from tests.helpers import API, assign, check_in, submit_form0


async def _participant_at_break(client, proctor, batch_id):
    p = await check_in(client, proctor["headers"], batch_id)
    await submit_form0(client, p["participant_code"])
    await assign(client, proctor["headers"], p["participant_id"], "CONTROL")
    # Submitting Session 1 scales transitions status to BREAK.
    items = [{"item_code": c, "rating": 3} for c in sorted(expected_scale_items(1, False))]
    r = await client.post(
        f"{API}/scales/submit",
        json={"participant_code": p["participant_code"], "session_number": 1, "items": items},
    )
    assert r.status_code == 201, r.text
    return p


async def test_break_cannot_complete_early_then_succeeds(client, proctor, site_and_batch):
    p = await _participant_at_break(client, proctor, site_and_batch["batch_id"])
    code = p["participant_code"]

    start = await client.post(f"{API}/break/start", json={"participant_code": code})
    assert start.status_code == 200
    assert "break_ends_at" in start.json()

    early = await client.post(f"{API}/break/complete", json={"participant_code": code})
    assert early.status_code == 403
    assert early.json()["error"]["code"] == "BREAK_NOT_OVER"

    # BREAK_DURATION_SECONDS is forced to 3 in the test env.
    await asyncio.sleep(3.3)
    done = await client.post(f"{API}/break/complete", json={"participant_code": code})
    assert done.status_code == 204

    status = await client.post(f"{API}/session/resume", json={"participant_code": code})
    assert status.json()["status"] == "SESSION2"
    assert status.json()["current_session"] == 2
