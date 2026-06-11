"""Shared test helpers that drive the API through a participant lifecycle."""
from __future__ import annotations

from httpx import AsyncClient

from app.instruments import SESSION1_TASK_CODES, SESSION2_TASK_CODES, TASKS_BY_CODE

API = "/api/v1"
JUSTIFICATION = "I computed each part carefully and double-checked the working twice."  # ≥30 chars


def correct_answer_for(task_code: str) -> str:
    if task_code == "C2":
        return "WEEKLY|5000"
    return TASKS_BY_CODE[task_code]["correct_answer"]


async def check_in(client: AsyncClient, headers: dict, batch_id) -> dict:
    from tests.conftest import device_payload

    resp = await client.post(
        f"{API}/participants/check-in",
        headers=headers,
        json={"batch_id": str(batch_id), "consent_given": True, **device_payload()},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def submit_form0(
    client: AsyncClient,
    code: str,
    *,
    education: str = "DEGREE",
    frequency: str = "DAILY",
    b01: str = "4800",
    b02: str = "15",
    b03: str = "Yes",
    b04: str = "09:55",
) -> dict:
    resp = await client.post(
        f"{API}/form0/submit",
        json={
            "participant_code": code,
            "age_band": "25_34",
            "education_level": education,
            "english_comfort": 4,
            "ai_use_frequency": frequency,
            "ai_confidence": 3,
            "warmup_b01_answer": b01,
            "warmup_b02_answer": b02,
            "warmup_b03_answer": b03,
            "warmup_b04_answer": b04,
        },
    )
    return resp


async def assign(client: AsyncClient, headers: dict, participant_id, group: str, method: str = "SUGGESTED_ACCEPTED") -> dict:
    resp = await client.post(
        f"{API}/participants/{participant_id}/assignment",
        headers=headers,
        json={"group": group, "method": method, "override_reason": "test" if method == "MANUAL_OVERRIDE" else None},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


def task_payload(code: str, session: int, group: str, **overrides) -> dict:
    is_ai_s1 = group == "AI_ASSISTED" and session == 1
    payload = {
        "participant_code": overrides.pop("participant_code", None),
        "session_number": session,
        "task_code": code,
        "objective_answer": correct_answer_for(code),
        "text_justification": JUSTIFICATION,
        "task_familiarity": True,
        "self_check": True,
        "confidence_rating": 4,
        "control_compliance": True if (group == "CONTROL" and session == 1) else None,
        "assistance_level": 0 if is_ai_s1 else None,
        "requests_count": 0 if is_ai_s1 else None,
        "copy_used": False if is_ai_s1 else None,
        "verified": False if is_ai_s1 else None,
        "verification_method": None,
        "verification_method_other": None,
        "verification_evidence": None,
        "duration_objective_ms": 1000,
        "duration_justification_ms": 1000,
        "duration_total_ms": 2000,
        "answer_change_count": 0,
        "participant_notes": None,
        "telemetry_batch": [],
    }
    payload.update(overrides)
    return payload


async def submit_all_session1(client: AsyncClient, code: str, group: str) -> None:
    for task_code in SESSION1_TASK_CODES:
        resp = await client.post(
            f"{API}/tasks/{task_code}/submit",
            json=task_payload(task_code, 1, group, participant_code=code),
        )
        assert resp.status_code == 200, resp.text


async def submit_all_session2(client: AsyncClient, code: str, group: str) -> None:
    for task_code in SESSION2_TASK_CODES:
        resp = await client.post(
            f"{API}/tasks/{task_code}/submit",
            json=task_payload(task_code, 2, group, participant_code=code),
        )
        assert resp.status_code == 200, resp.text
