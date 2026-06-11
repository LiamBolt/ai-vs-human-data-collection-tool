"""Auth + role-guard tests."""
from __future__ import annotations

from tests.helpers import API


async def test_login_success(client, proctor):
    resp = await client.post(f"{API}/auth/login", json={"username": "proctor1", "password": "pw-proctor1"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["role"] == "PROCTOR"
    assert body["token_type"] == "bearer"
    assert body["access_token"]


async def test_login_wrong_password(client, proctor):
    resp = await client.post(f"{API}/auth/login", json={"username": "proctor1", "password": "nope"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "INVALID_CREDENTIALS"


async def test_protected_route_requires_token(client):
    resp = await client.get(f"{API}/sites")
    assert resp.status_code == 401


async def test_role_guard_blocks_rater(client, rater_a):
    resp = await client.get(f"{API}/sites", headers=rater_a["headers"])
    assert resp.status_code == 403
