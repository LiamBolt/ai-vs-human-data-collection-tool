"""Rater (blinded) schemas — expose nothing that could deanonymize or bias scoring."""
from __future__ import annotations

import uuid

from pydantic import BaseModel, Field


class RaterQueueItem(BaseModel):
    response_id: uuid.UUID
    session_number: int
    task_code: str
    objective_question: str
    objective_answer: str
    text_justification: str
    # Deliberately ABSENT: participant_code, group, assistance/hint fields,
    # telemetry, confidence, timers. Enforced by a blinding test.


class RaterScoreRequest(BaseModel):
    response_id: uuid.UUID
    correctness: int = Field(ge=0, le=2)
    justification_quality: int = Field(ge=0, le=2)
    independence: int = Field(ge=0, le=2)
