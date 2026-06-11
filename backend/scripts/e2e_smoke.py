"""End-to-end smoke test / demo — drives a full participant lifecycle via the API.

Run inside the compose network (or against the nginx-proxied API) with a short break:
    BREAK_DURATION_SECONDS=3 E2E_BASE_URL=http://localhost/api/v1 python scripts/e2e_smoke.py

Asserts: 10 task_responses, telemetry rows present (>=22), hint_events present,
and export row counts are coherent.
"""
from __future__ import annotations

import os
import sys
import time
import uuid

import httpx

BASE = os.environ.get("E2E_BASE_URL", "http://localhost/api/v1")
ADMIN_USER = os.environ.get("ADMIN_BOOTSTRAP_USERNAME", "admin")
ADMIN_PASS = os.environ.get("ADMIN_BOOTSTRAP_PASSWORD", "changeme-admin")

SESSION1 = ["A1", "A2", "B1", "B2", "C1", "C2"]
SESSION2 = ["A3", "A4", "B3", "B4"]
CORRECT = {
    "A1": "17000", "A2": "83.3", "B1": "YES", "B2": "NO", "C1": "50000", "C2": "WEEKLY|5000",
    "A3": "19500", "A4": "142.5", "B3": "YES", "B4": "NO",
}
JUSTIFICATION = "I worked through each step and verified the result before submitting it."
S1_SCALES = [f"S1-{x}" for x in ("E1", "E2", "E3", "H1", "H2", "H3", "T1", "T2", "T3")]
S2_SCALES = [f"S2-{x}" for x in ("E1", "E2", "E3", "H1", "H2", "H3", "I1", "I2", "I3")]


def event(event_type: str, session: int, task_code: str | None = None) -> dict:
    return {
        "client_event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "task_code": task_code,
        "session_number": session,
        "client_timestamp_ms": int(time.time() * 1000),
        "event_metadata": {},
    }


def task_body(code: str, session: int, participant_code: str) -> dict:
    is_ai_s1 = session == 1
    return {
        "participant_code": participant_code,
        "session_number": session,
        "task_code": code,
        "objective_answer": CORRECT[code],
        "text_justification": JUSTIFICATION,
        "task_familiarity": True,
        "self_check": True,
        "confidence_rating": 4,
        "control_compliance": None,
        "assistance_level": 1 if is_ai_s1 else None,
        "requests_count": 1 if is_ai_s1 else None,
        "copy_used": False if is_ai_s1 else None,
        "verified": False if is_ai_s1 else None,
        "verification_method": None,
        "verification_method_other": None,
        "verification_evidence": None,
        "duration_objective_ms": 1200,
        "duration_justification_ms": 3400,
        "duration_total_ms": 4600,
        "answer_change_count": 1,
        "participant_notes": None,
        "telemetry_batch": [event("SESSION_START", session, code), event("ANSWER_REVISION", session, code)],
    }


def main() -> int:
    with httpx.Client(base_url=BASE, timeout=30) as c:
        # 1. Staff login (admin can act as proctor).
        token = c.post("/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}).json()["access_token"]
        h = {"Authorization": f"Bearer {token}"}

        # 2. Clinic setup.
        sites = c.get("/sites", headers=h).json()
        if sites:
            site_id = sites[0]["id"]
        else:
            site_id = c.post("/sites", headers=h, json={"site_code": "SMOKE_SITE", "site_name": "Smoke Site"}).json()["id"]
        batch = c.post(
            "/batches", headers=h,
            json={"site_id": site_id, "clinic_date": "2024-01-01", "layer": 1, "timing_mode": "PER_TASK"},
        ).json()

        # 3. Check-in.
        ci = c.post(
            "/participants/check-in", headers=h,
            json={"batch_id": batch["id"], "consent_given": True, "device_category": "DESKTOP",
                  "os_family": "Linux", "browser_family": "Firefox", "user_agent_raw": "smoke"},
        ).json()
        pid, code = ci["participant_id"], ci["participant_code"]
        print(f"[smoke] participant {code}")

        # 4. Form 0.
        c.post("/form0/submit", json={
            "participant_code": code, "age_band": "25_34", "education_level": "DEGREE",
            "english_comfort": 4, "ai_use_frequency": "DAILY", "ai_confidence": 3,
            "warmup_b01_answer": "4800", "warmup_b02_answer": "15", "warmup_b03_answer": "Yes", "warmup_b04_answer": "09:55",
        }).raise_for_status()

        # 5. Assignment (after Form 0).
        sugg = c.get(f"/participants/{pid}/assignment-suggestion", headers=h)
        sugg.raise_for_status()
        c.post(f"/participants/{pid}/assignment", headers=h,
               json={"group": "AI_ASSISTED", "method": "SUGGESTED_ACCEPTED", "override_reason": None}).raise_for_status()

        # 6. Session 1 — six tasks, each with a hint.
        for code_t in SESSION1:
            c.post("/hints/request", json={"participant_code": code, "task_code": code_t, "level": 1}).raise_for_status()
            c.post(f"/tasks/{code_t}/submit", json=task_body(code_t, 1, code)).raise_for_status()

        # 7. Session 1 scales.
        c.post("/scales/submit", json={"participant_code": code, "session_number": 1,
                                       "items": [{"item_code": x, "rating": 3} for x in S1_SCALES]}).raise_for_status()

        # 8. Break (env should set BREAK_DURATION_SECONDS low).
        c.post("/break/start", json={"participant_code": code}).raise_for_status()
        while True:
            remaining = c.get("/break/status", params={"participant_code": code}).json()["remaining_seconds"]
            if remaining <= 0:
                break
            time.sleep(min(remaining, 1) + 0.2)
        c.post("/break/complete", json={"participant_code": code}).raise_for_status()

        # 9. Session 2 — four tasks (no hints).
        for code_t in SESSION2:
            c.post(f"/tasks/{code_t}/submit", json=task_body(code_t, 2, code)).raise_for_status()

        # 10. Transfer prompt + Session 2 scales.
        c.post("/session2/transfer-prompt", json={"participant_code": code, "used": True, "text": "Used the same checking method."}).raise_for_status()
        c.post("/scales/submit", json={"participant_code": code, "session_number": 2,
                                       "items": [{"item_code": x, "rating": 4} for x in S2_SCALES]}).raise_for_status()

        # 11. Assertions via resume + exports meta.
        final = c.post("/session/resume", json={"participant_code": code}).json()
        assert final["status"] == "COMPLETED", final
        meta = {m["name"]: m["row_count"] for m in c.get("/exports/meta", headers=h).json()}
        assert meta["task_responses"] >= 10, meta
        assert meta["telemetry_events"] >= 22, meta
        assert meta["hint_events"] >= 6, meta
        print(f"[smoke] OK — task_responses={meta['task_responses']} telemetry={meta['telemetry_events']} hints={meta['hint_events']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
