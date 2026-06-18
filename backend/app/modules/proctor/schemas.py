"""Proctor / admin request & response schemas."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.enums import (
    AssignmentMethod,
    DeviceCategory,
    GroupAssignment,
    ParticipantStatus,
    TimingMode,
)


# ── Sites ─────────────────────────────────────────────────────────────────────
class SiteCreate(BaseModel):
    site_code: str = Field(min_length=1, max_length=50)
    site_name: str = Field(min_length=1)


class SiteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    site_code: str
    site_name: str
    created_at: datetime


# ── Batches ───────────────────────────────────────────────────────────────────
class BatchCreate(BaseModel):
    site_id: uuid.UUID
    clinic_date: date
    layer: int = Field(default=1, ge=1, le=2)
    timing_mode: TimingMode = TimingMode.PER_TASK


class BatchOut(BaseModel):
    id: uuid.UUID
    site_id: uuid.UUID
    site_code: str
    batch_code: str
    clinic_date: date
    layer: int
    timing_mode: TimingMode
    created_at: datetime


# ── Check-in ──────────────────────────────────────────────────────────────────
class CheckInRequest(BaseModel):
    batch_id: uuid.UUID
    consent_given: bool
    device_category: DeviceCategory
    os_family: str = Field(max_length=50)
    browser_family: str = Field(max_length=50)
    user_agent_raw: str


class CheckInResponse(BaseModel):
    participant_id: uuid.UUID
    participant_code: str


class AwaitingCountOut(BaseModel):
    count: int


# ── Assignment ────────────────────────────────────────────────────────────────
class AssignmentSuggestion(BaseModel):
    participant_id: uuid.UUID
    suggested_group: GroupAssignment
    stratum: str
    current_counts: dict[str, int]


class AssignmentRequest(BaseModel):
    group: GroupAssignment
    method: AssignmentMethod
    override_reason: str | None = None


# ── Warm-up override ──────────────────────────────────────────────────────────
class WarmupOverrideRequest(BaseModel):
    score: int = Field(ge=0, le=4)


# ── Deviations / Layer 2 ──────────────────────────────────────────────────────
class DeviationRequest(BaseModel):
    batch_id: uuid.UUID
    participant_id: uuid.UUID | None = None
    description: str = Field(min_length=1)


class Layer2Request(BaseModel):
    participant_id: uuid.UUID
    prompt_log_id: str = Field(min_length=1, max_length=40)
    model_name_shown: str = Field(min_length=1, max_length=60)
    prompt_count: int = Field(ge=0)
    time_in_tool_minutes: float = Field(ge=0)
    copy_similarity_note: str | None = None


# ── Monitor ───────────────────────────────────────────────────────────────────
class MonitorRow(BaseModel):
    participant_id: uuid.UUID
    participant_code: str
    status: ParticipantStatus
    current_step: str
    last_sync_age_seconds: int
    infraction_count: int
    warmup_score: int | None
    warmup_score_overridden: bool
    group_assignment: GroupAssignment | None
