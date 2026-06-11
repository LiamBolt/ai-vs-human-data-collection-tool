"""Verbatim study instrument content (MEGA_PROMPT Module D).

Single source of truth shared by the seeder, server-side validation, and exports.
DO NOT reword, reorder, or "improve" any of this content — the science depends on
standardization. Values are character-for-character from Module D.
"""
from __future__ import annotations

from app.enums import AnswerType

# ── D3. Tasks (answer keys fixed in advance) ──────────────────────────────────
TASKS: list[dict] = [
    {
        "task_code": "A1", "session_number": 1, "display_order": 1, "family": "Data arithmetic",
        "answer_type": AnswerType.NUMERIC, "correct_answer": "17000", "answer_tolerance": None, "parallel_to": None,
        "objective_question": "Prices: Bread 2,000 UGX, Milk 3,500 UGX, Sugar 4,000 UGX. A customer buys 3 bread, 2 milk, 1 sugar. What is the total cost?",
        "justification_prompt": "Explain how you computed the total and how you checked the arithmetic.",
    },
    {
        "task_code": "A2", "session_number": 1, "display_order": 2, "family": "Percent change",
        "answer_type": AnswerType.NUMERIC, "correct_answer": "83.3", "answer_tolerance": 0.4, "parallel_to": None,
        "objective_question": "Weekly malaria cases: W1=30, W2=45, W3=40, W4=55. Percent increase from W1 to W4?",
        "justification_prompt": "Show the formula and steps. Include a quick check.",
    },
    {
        "task_code": "B1", "session_number": 1, "display_order": 3, "family": "Logic validity",
        "answer_type": AnswerType.YES_NO, "correct_answer": "YES", "answer_tolerance": None, "parallel_to": None,
        "objective_question": "If it rains, the road floods. The road did not flood. Therefore it did not rain. Is this valid? Yes or No.",
        "justification_prompt": "Explain in 1 to 3 sentences using the rule given.",
    },
    {
        "task_code": "B2", "session_number": 1, "display_order": 4, "family": "Time consistency",
        "answer_type": AnswerType.YES_NO, "correct_answer": "NO", "answer_tolerance": None, "parallel_to": None,
        "objective_question": "A timetable says a bus leaves at 08:00 and takes 1 hour 30 minutes. It arrived at 10:00. Is the timetable consistent? Yes or No.",
        "justification_prompt": "Explain your time calculation and what would be consistent.",
    },
    {
        "task_code": "C1", "session_number": 1, "display_order": 5, "family": "Simple interest",
        "answer_type": AnswerType.NUMERIC, "correct_answer": "50000", "answer_tolerance": None, "parallel_to": None,
        "objective_question": "Loan 1,000,000 UGX at 10% simple interest for 6 months. Interest amount?",
        "justification_prompt": "Write the formula and show one line of calculation.",
    },
    {
        "task_code": "C2", "session_number": 1, "display_order": 6, "family": "Cost comparison",
        "answer_type": AnswerType.TEXT, "correct_answer": "Weekly cheaper by 5,000 UGX (45,000 vs 50,000)",
        "answer_tolerance": None, "parallel_to": None,
        "objective_question": "Plan is 5,000 UGX per day or 30,000 UGX per week. For 10 days, which is cheaper and by how much?",
        "justification_prompt": "Explain the comparison.",
    },
    {
        "task_code": "A3", "session_number": 2, "display_order": 1, "family": "Data arithmetic (parallel)",
        "answer_type": AnswerType.NUMERIC, "correct_answer": "19500", "answer_tolerance": None, "parallel_to": "A1",
        "objective_question": "Prices: Rice 4,500 UGX, Beans 3,000 UGX, Soap 2,500 UGX. Buy 2 rice, 1 beans, 3 soap. What is the total cost?",
        "justification_prompt": "Show how you checked the calculation.",
    },
    {
        "task_code": "A4", "session_number": 2, "display_order": 2, "family": "Average (parallel)",
        "answer_type": AnswerType.NUMERIC, "correct_answer": "142.5", "answer_tolerance": 0.5, "parallel_to": "A2",
        "objective_question": "Water use in litres: Day 1 = 120, Day 2 = 150, Day 3 = 135, Day 4 = 165. What is the average daily use?",
        "justification_prompt": "Explain the steps for an average.",
    },
    {
        "task_code": "B3", "session_number": 2, "display_order": 3, "family": "Logic (parallel)",
        "answer_type": AnswerType.YES_NO, "correct_answer": "YES", "answer_tolerance": None, "parallel_to": "B1",
        "objective_question": "If a person is a student, then they have a registration number. John has no registration number. Can we conclude John is not a student? Yes or No.",
        "justification_prompt": "Explain your reasoning.",
    },
    {
        "task_code": "B4", "session_number": 2, "display_order": 4, "family": "Time (parallel)",
        "answer_type": AnswerType.YES_NO, "correct_answer": "NO", "answer_tolerance": None, "parallel_to": "B2",
        "objective_question": "A meeting starts at 14:10 and lasts 50 minutes. The minutes say it ended at 15:20. Is that correct? Yes or No.",
        "justification_prompt": "Explain the time calculation.",
    },
]

SESSION1_TASK_CODES = [t["task_code"] for t in TASKS if t["session_number"] == 1]
SESSION2_TASK_CODES = [t["task_code"] for t in TASKS if t["session_number"] == 2]
TASKS_BY_CODE = {t["task_code"]: t for t in TASKS}

# ── D4. Offline Hint Bank (Session 1 tasks only, levels 1–3, verbatim) ────────
HINTS: dict[str, dict[int, str]] = {
    "A1": {1: "Multiply price×quantity then add.",
           2: "3×2000=____; 2×3500=____; 1×4000=____; add.",
           3: "3×2000=6000; 2×3500=7000; 1×4000=4000; total 17000; verify by re-add/estimate."},
    "A2": {1: "(new−old)/old×100.",
           2: "55−30=____; ____/30=____; ×100.",
           3: "25/30≈0.833; 83.3%; verify 30×0.83≈25."},
    "B1": {1: "Check logical form A→B, ¬B, therefore ¬A.",
           2: "Let A=rains B=floods; is it valid?",
           3: "Valid (modus tollens) under rule; justify assumption."},
    "B2": {1: "Add travel time to departure.",
           2: "08:00 + 1h = 09:00; +30m = 09:30.",
           3: "Expected 09:30, not 10:00; verify via minutes."},
    "C1": {1: "Simple interest P×R×T, convert months.",
           2: "T=6 months=0.5 years; interest = 1,000,000×0.10×0.5=____.",
           3: "Interest=50,000; verify 10%/yr=100,000 then half year."},
    "C2": {1: "Compute daily total and weekly+extra days.",
           2: "Daily 10×5000=____; Weekly 30000 + 3×5000=____.",
           3: "50,000 vs 45,000; weekly cheaper by 5,000; verify subtract."},
}

# ── D2. Baseline warm-up acceptance keys (auto-score 1 point each) ────────────
# Each entry: a normalizer-friendly set of accepted answers (case/space-insensitive).
WARMUP_KEYS = {
    "b01": {"accepts": {"4800", "4,800", "4800ugx", "4,800ugx"}, "label": "B0-1"},
    "b02": {"accepts": {"15", "15%", "15percentagepoints", "15percent", "15points"}, "label": "B0-2"},
    "b03": {"accepts": {"yes", "y"}, "label": "B0-3"},
    "b04": {"accepts": {"09:55", "9:55", "0955"}, "label": "B0-4"},
}

# ── D6. Post-block scale items (Likert 1–5) ───────────────────────────────────
# group: "ALL" shown to everyone; "AI_ASSISTED" shown to AI group only (S1 trust).
SCALE_ITEMS: list[dict] = [
    # Session 1 — Effort
    {"item_code": "S1-E1", "session": 1, "group": "ALL", "text": "This task set required a lot of mental effort."},
    {"item_code": "S1-E2", "session": 1, "group": "ALL", "text": "I had to concentrate hard during the tasks."},
    {"item_code": "S1-E3", "session": 1, "group": "ALL", "text": "I felt mentally tired after completing the tasks."},
    # Session 1 — Engagement
    {"item_code": "S1-H1", "session": 1, "group": "ALL", "text": "I stayed actively involved while solving the tasks."},
    {"item_code": "S1-H2", "session": 1, "group": "ALL", "text": "I tried to understand each step, not only the final answer."},
    {"item_code": "S1-H3", "session": 1, "group": "ALL", "text": "I checked my reasoning before submitting answers."},
    # Session 1 — Trust and calibration (AI-assisted only)
    {"item_code": "S1-T1", "session": 1, "group": "AI_ASSISTED", "text": "I accepted assistance quickly because it looked confident or authoritative."},
    {"item_code": "S1-T2", "session": 1, "group": "AI_ASSISTED", "text": "I would have preferred to verify more, but time or effort made me skip verification."},
    {"item_code": "S1-T3", "session": 1, "group": "AI_ASSISTED", "text": "I feel I could solve similar tasks later without AI help."},
    # Session 2 — Effort
    {"item_code": "S2-E1", "session": 2, "group": "ALL", "text": "This task set required a lot of mental effort."},
    {"item_code": "S2-E2", "session": 2, "group": "ALL", "text": "I had to concentrate hard during the tasks."},
    {"item_code": "S2-E3", "session": 2, "group": "ALL", "text": "I felt mentally tired after completing the tasks."},
    # Session 2 — Engagement
    {"item_code": "S2-H1", "session": 2, "group": "ALL", "text": "I stayed actively involved while solving the tasks."},
    {"item_code": "S2-H2", "session": 2, "group": "ALL", "text": "I tried to understand each step, not only the final answer."},
    {"item_code": "S2-H3", "session": 2, "group": "ALL", "text": "I checked my reasoning before submitting answers."},
    # Session 2 — Independence self-check
    {"item_code": "S2-I1", "session": 2, "group": "ALL", "text": "I felt the tasks were harder without AI than I expected."},
    {"item_code": "S2-I2", "session": 2, "group": "ALL", "text": "I could explain my reasoning clearly without AI help."},
    {"item_code": "S2-I3", "session": 2, "group": "ALL", "text": "I verified my answers more carefully in Session 2."},
]


def expected_scale_items(session_number: int, is_ai_assisted: bool) -> set[str]:
    """The exact set of scale item codes a participant must answer for a session."""
    codes: set[str] = set()
    for item in SCALE_ITEMS:
        if item["session"] != session_number:
            continue
        if item["group"] == "AI_ASSISTED" and not is_ai_assisted:
            continue
        codes.add(item["item_code"])
    return codes


# ── D7. Rubric anchors (rater panel, 0–2 each) — for reference/exports ────────
RUBRIC_ANCHORS = {
    "correctness": {0: "incorrect", 1: "partially correct", 2: "fully correct"},
    "justification_quality": {0: "absent/irrelevant", 1: "partial reasoning", 2: "clear, complete reasoning"},
    "independence": {0: "appears dependent/copied", 1: "mixed", 2: "clearly independent reasoning in own words"},
}
