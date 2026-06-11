"""Form 0 warm-up auto-scoring over the D2 acceptance variants."""
from __future__ import annotations

import pytest

from app.scoring import score_warmup
from tests.helpers import API, check_in, submit_form0


@pytest.mark.parametrize(
    "b01,b02,b03,b04,expected",
    [
        ("4800", "15", "Yes", "09:55", 4),
        ("4,800", "15%", "yes", "9:55", 4),
        ("4,800 UGX", "15 percentage points", "Y", "0955", 4),
        ("4801", "16", "No", "10:00", 0),
        ("4800", "15", "No", "09:55", 3),
    ],
)
def test_score_warmup_table(b01, b02, b03, b04, expected):
    assert score_warmup(b01, b02, b03, b04) == expected


async def test_form0_submit_returns_auto_score(client, proctor, site_and_batch):
    participant = await check_in(client, proctor["headers"], site_and_batch["batch_id"])
    resp = await submit_form0(client, participant["participant_code"], b01="4,800", b02="15%", b03="yes", b04="9:55")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "FORM0"
    assert body["warmup_auto_score"] == 4
    assert body["assignment_pending"] is True
