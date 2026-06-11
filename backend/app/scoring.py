"""Deterministic auto-scoring for warm-up items (D2) and task objectives (D3)."""
from __future__ import annotations

import re

from app.enums import AnswerType
from app.instruments import WARMUP_KEYS


def _normalize(text: str) -> str:
    """Lowercase and strip all whitespace — matches the normalized WARMUP_KEYS sets."""
    return re.sub(r"\s+", "", text.strip().lower())


def _extract_number(text: str) -> float | None:
    """Pull the first numeric value out of a free-text answer (commas/units tolerated)."""
    cleaned = text.replace(",", "")
    match = re.search(r"[-+]?\d*\.?\d+", cleaned)
    if not match:
        return None
    try:
        return float(match.group())
    except ValueError:
        return None


def _normalize_yes_no(text: str) -> str | None:
    t = text.strip().lower()
    if not t:
        return None
    if t[0] == "y":
        return "YES"
    if t[0] == "n":
        return "NO"
    return None


def score_warmup(b01: str, b02: str, b03: str, b04: str) -> int:
    """Return 0–4: one point per warm-up item that matches its D2 acceptance set."""
    answers = {"b01": b01, "b02": b02, "b03": b03, "b04": b04}
    score = 0
    for key, value in answers.items():
        accepts = WARMUP_KEYS[key]["accepts"]
        if _normalize(value or "") in accepts:
            score += 1
    return score


def score_objective(task: dict, answer: str) -> bool:
    """Auto-correctness of an objective answer against the fixed D3 key.

    `task` is an entry from instruments.TASKS (or the equivalent ORM dict).
    """
    task_code = task["task_code"]
    answer_type: AnswerType = task["answer_type"]
    correct = task["correct_answer"]
    tolerance = task.get("answer_tolerance")

    # C2 is comparative — stored as "WEEKLY|5000"; both parts must be right.
    if task_code == "C2":
        parts = answer.upper().split("|")
        if len(parts) != 2:
            return False
        plan = parts[0].strip()
        amount = _extract_number(parts[1])
        return plan == "WEEKLY" and amount is not None and abs(amount - 5000) < 1e-6

    if answer_type == AnswerType.YES_NO:
        return _normalize_yes_no(answer) == correct.strip().upper()

    if answer_type == AnswerType.NUMERIC:
        got = _extract_number(answer)
        key = _extract_number(correct)
        if got is None or key is None:
            return False
        tol = float(tolerance) if tolerance is not None else 0.0
        return abs(got - key) <= tol + 1e-9

    # Generic TEXT fallback (no other TEXT task exists today).
    return _normalize(answer) == _normalize(correct)
