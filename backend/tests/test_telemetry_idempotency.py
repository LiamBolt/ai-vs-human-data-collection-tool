"""Telemetry idempotency: resending the same client_event_id batch creates no duplicates."""
from __future__ import annotations

import uuid

from sqlalchemy import func, select

from app.models import TelemetryLog
from tests.conftest import TestSession
from tests.helpers import API, check_in, submit_form0


async def test_resync_same_batch_is_idempotent(client, proctor, site_and_batch):
    p = await check_in(client, proctor["headers"], site_and_batch["batch_id"])
    await submit_form0(client, p["participant_code"])
    code = p["participant_code"]

    eid1, eid2 = str(uuid.uuid4()), str(uuid.uuid4())
    batch = [
        {"client_event_id": eid1, "event_type": "TAB_BLUR", "task_code": "A1", "session_number": 1,
         "client_timestamp_ms": 111, "event_metadata": {}},
        {"client_event_id": eid2, "event_type": "TAB_FOCUS", "task_code": "A1", "session_number": 1,
         "client_timestamp_ms": 222, "event_metadata": {"away_duration_ms": 5}},
    ]
    body = {"participant_code": code, "current_step": "s1_task_A1", "draft_responses": {}, "telemetry_batch": batch}

    r1 = await client.patch(f"{API}/session/state", json=body)
    assert r1.status_code == 204
    r2 = await client.patch(f"{API}/session/state", json=body)  # exact resend
    assert r2.status_code == 204

    async with TestSession() as db:
        count = (await db.execute(select(func.count()).select_from(TelemetryLog))).scalar_one()
        assert count == 2  # not 4
