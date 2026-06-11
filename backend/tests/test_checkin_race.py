"""Race-safe sequential participant codes: 20 concurrent check-ins, no duplicates."""
from __future__ import annotations

import asyncio

from tests.conftest import device_payload
from tests.helpers import API


async def test_concurrent_checkins_generate_unique_codes(client, proctor, site_and_batch):
    batch_id = str(site_and_batch["batch_id"])

    async def one():
        return await client.post(
            f"{API}/participants/check-in",
            headers=proctor["headers"],
            json={"batch_id": batch_id, "consent_given": True, **device_payload()},
        )

    results = await asyncio.gather(*[one() for _ in range(20)])
    assert all(r.status_code == 201 for r in results)

    codes = [r.json()["participant_code"] for r in results]
    assert len(codes) == 20
    assert len(set(codes)) == 20  # all unique
    # Codes follow {SITE}-{BATCH##}-{####}
    assert all(c.startswith("UCU_MUKONO-01-") for c in codes)
