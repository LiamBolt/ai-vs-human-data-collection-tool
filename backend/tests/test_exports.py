"""Export suite: every CSV parses in pandas, keys present, user_agent_raw absent."""
from __future__ import annotations

import io

import pandas as pd

from tests.helpers import API, assign, check_in, submit_form0, task_payload

EXPORT_NAMES = [
    "participants", "task_responses", "telemetry_events", "hint_events", "scale_responses",
    "rater_scores", "session_meta", "deviation_logs", "layer2_logs", "data_dictionary",
]


async def _seed_some_data(client, proctor, batch_id):
    p = await check_in(client, proctor["headers"], batch_id)
    await submit_form0(client, p["participant_code"])
    await assign(client, proctor["headers"], p["participant_id"], "AI_ASSISTED")
    await client.post(f"{API}/hints/request", json={"participant_code": p["participant_code"], "task_code": "A1", "level": 1})
    await client.post(f"{API}/tasks/A1/submit", json=task_payload("A1", 1, "AI_ASSISTED", participant_code=p["participant_code"]))
    return p


async def test_all_exports_parse_in_pandas(client, proctor, site_and_batch):
    await _seed_some_data(client, proctor, site_and_batch["batch_id"])

    for name in EXPORT_NAMES:
        resp = await client.get(f"{API}/exports/{name}.csv", headers=proctor["headers"])
        assert resp.status_code == 200, f"{name}: {resp.text}"
        assert resp.headers["content-type"].startswith("text/csv")
        df = pd.read_csv(io.StringIO(resp.text))  # must parse cleanly
        if name not in ("data_dictionary",):
            assert "participant_code" in df.columns


async def test_participants_export_excludes_user_agent(client, proctor, site_and_batch):
    await _seed_some_data(client, proctor, site_and_batch["batch_id"])
    resp = await client.get(f"{API}/exports/participants.csv", headers=proctor["headers"])
    df = pd.read_csv(io.StringIO(resp.text))
    assert "user_agent_raw" not in df.columns
    assert "participant_code" in df.columns
    assert len(df) == 1


async def test_export_meta_lists_all(client, proctor, site_and_batch):
    await _seed_some_data(client, proctor, site_and_batch["batch_id"])
    resp = await client.get(f"{API}/exports/meta", headers=proctor["headers"])
    assert resp.status_code == 200
    names = {m["name"] for m in resp.json()}
    assert names == set(EXPORT_NAMES)


async def test_task_responses_merge_keys(client, proctor, site_and_batch):
    await _seed_some_data(client, proctor, site_and_batch["batch_id"])
    resp = await client.get(f"{API}/exports/task_responses.csv", headers=proctor["headers"])
    df = pd.read_csv(io.StringIO(resp.text))
    for key in ("participant_code", "session_number", "task_code"):
        assert key in df.columns
