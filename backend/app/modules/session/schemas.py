"""Participant-flow request & response schemas (match frontend contracts)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.enums import (
    AgeBand,
    AiUseFrequency,
    AnswerType,
    EducationLevel,
    GroupAssignment,
    ParticipantStatus,
    TelemetryEventType,
    VerificationMethod,
)


# ── Public instrument (answer key intentionally omitted — see DECISIONS D018) ──
class PublicTaskOut(BaseModel):
    id: uuid.UUID
    task_code: str
    session_number: int
    display_order: int
    family: str
    objective_question: str
    justification_prompt: str
    answer_type: AnswerType
    parallel_to: str | None


# ── Telemetry ─────────────────────────────────────────────────────────────────
class TelemetryEventIn(BaseModel):
    client_event_id: uuid.UUID
    event_type: TelemetryEventType
    task_code: str | None = None
    session_number: int = Field(ge=1, le=2)
    client_timestamp_ms: int
    event_metadata: dict[str, Any] = Field(default_factory=dict)


# ── Resume / state ────────────────────────────────────────────────────────────
class ResumeRequest(BaseModel):
    participant_code: str = Field(min_length=1, max_length=40)


class ResumeResponse(BaseModel):
    participant_code: str
    status: ParticipantStatus
    current_step: str
    group_assignment: GroupAssignment | None
    current_session: int
    draft_responses: dict[str, Any]
    break_ends_at: datetime | None
    current_task: PublicTaskOut | None


class StateSyncRequest(BaseModel):
    participant_code: str
    current_step: str = Field(max_length=60)
    draft_responses: dict[str, Any] = Field(default_factory=dict)
    telemetry_batch: list[TelemetryEventIn] = Field(default_factory=list)


# ── Form 0 ────────────────────────────────────────────────────────────────────
class Form0Request(BaseModel):
    participant_code: str
    age_band: AgeBand
    education_level: EducationLevel
    english_comfort: int = Field(ge=1, le=5)
    ai_use_frequency: AiUseFrequency
    ai_confidence: int = Field(ge=1, le=5)
    warmup_b01_answer: str
    warmup_b02_answer: str
    warmup_b03_answer: str
    warmup_b04_answer: str


class Form0Response(BaseModel):
    status: Literal["FORM0"] = "FORM0"
    warmup_auto_score: int
    assignment_pending: Literal[True] = True


# ── Task submit ───────────────────────────────────────────────────────────────
class TaskSubmitRequest(BaseModel):
    participant_code: str
    session_number: int = Field(ge=1, le=2)
    task_code: str
    objective_answer: str
    text_justification: str
    task_familiarity: bool
    self_check: bool
    confidence_rating: int = Field(ge=1, le=5)
    control_compliance: bool | None = None
    # AI-group Session-1 only
    assistance_level: int | None = Field(default=None, ge=0, le=3)
    requests_count: int | None = Field(default=None, ge=0)
    copy_used: bool | None = None
    verified: bool | None = None
    verification_method: VerificationMethod | None = None
    verification_method_other: str | None = None
    verification_evidence: str | None = None
    # Timers
    duration_objective_ms: int = Field(ge=0)
    duration_justification_ms: int = Field(ge=0)
    duration_total_ms: int = Field(ge=0)
    answer_change_count: int = Field(ge=0)
    participant_notes: str | None = None
    telemetry_batch: list[TelemetryEventIn] = Field(default_factory=list)


class TaskSubmitResponse(BaseModel):
    next_step: str
    session_complete: bool


# ── Hints ─────────────────────────────────────────────────────────────────────
class HintRequest(BaseModel):
    participant_code: str
    task_code: str
    level: int = Field(ge=1, le=3)


class HintResponse(BaseModel):
    hint_text: str
    level: int
    task_code: str


# ── Break ─────────────────────────────────────────────────────────────────────
class BreakStartRequest(BaseModel):
    participant_code: str


class BreakStartResponse(BaseModel):
    break_ends_at: datetime


class BreakStatusResponse(BaseModel):
    remaining_seconds: int
    break_ends_at: datetime


class BreakCompleteRequest(BaseModel):
    participant_code: str


# ── Scales ────────────────────────────────────────────────────────────────────
class ScaleItemIn(BaseModel):
    item_code: str = Field(max_length=10)
    rating: int = Field(ge=1, le=5)


class ScaleSubmitRequest(BaseModel):
    participant_code: str
    session_number: int = Field(ge=1, le=2)
    items: list[ScaleItemIn]


# ── Transfer prompt ───────────────────────────────────────────────────────────
class TransferRequest(BaseModel):
    participant_code: str
    used: bool
    text: str | None = None
