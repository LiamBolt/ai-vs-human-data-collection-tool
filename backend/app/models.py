"""All SQLAlchemy ORM models (consolidated to avoid circular FK imports — see DECISIONS D015)."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app import enums


def _enum(py_enum, name: str) -> SAEnum:
    """Build a PG native enum that stores the Enum *values* (not member names)."""
    return SAEnum(
        py_enum,
        name=name,
        values_callable=lambda e: [member.value for member in e],
        native_enum=True,
        validate_strings=True,
    )


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# ── Reference / setup ─────────────────────────────────────────────────────────
class Site(Base, TimestampMixin):
    __tablename__ = "sites"

    id: Mapped[uuid.UUID] = _uuid_pk()
    site_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    site_name: Mapped[str] = mapped_column(Text, nullable=False)


class StaffUser(Base, TimestampMixin):
    __tablename__ = "staff_users"

    id: Mapped[uuid.UUID] = _uuid_pk()
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[enums.StaffRole] = mapped_column(_enum(enums.StaffRole, "staff_role"), nullable=False)
    display_code: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Batch(Base, TimestampMixin):
    __tablename__ = "batches"

    id: Mapped[uuid.UUID] = _uuid_pk()
    site_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sites.id"), nullable=False)
    batch_code: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    batch_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    clinic_date: Mapped[date] = mapped_column(Date, nullable=False)
    layer: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    timing_mode: Mapped[enums.TimingMode] = mapped_column(
        _enum(enums.TimingMode, "timing_mode"), nullable=False, default=enums.TimingMode.PER_TASK
    )
    # Race-safe per-batch participant counter (incremented under SELECT ... FOR UPDATE).
    participant_seq: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("staff_users.id"), nullable=True)

    site: Mapped[Site] = relationship()


# ── Instruments (seeded) ──────────────────────────────────────────────────────
class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = _uuid_pk()
    task_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    session_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    display_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    family: Mapped[str] = mapped_column(Text, nullable=False)
    objective_question: Mapped[str] = mapped_column(Text, nullable=False)
    justification_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    answer_type: Mapped[enums.AnswerType] = mapped_column(_enum(enums.AnswerType, "answer_type"), nullable=False)
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    answer_tolerance: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    parallel_to: Mapped[str | None] = mapped_column(String(10), nullable=True)


class Hint(Base, TimestampMixin):
    __tablename__ = "hints"
    __table_args__ = (
        UniqueConstraint("task_code", "level", name="uq_hint_task_level"),
        CheckConstraint("level IN (1,2,3)", name="ck_hint_level"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    task_code: Mapped[str] = mapped_column(ForeignKey("tasks.task_code"), nullable=False)
    level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    hint_text: Mapped[str] = mapped_column(Text, nullable=False)


# ── Participants ──────────────────────────────────────────────────────────────
class Participant(Base, TimestampMixin):
    __tablename__ = "participants"
    __table_args__ = (
        CheckConstraint("english_comfort IS NULL OR (english_comfort BETWEEN 1 AND 5)", name="ck_english_comfort"),
        CheckConstraint("ai_confidence IS NULL OR (ai_confidence BETWEEN 1 AND 5)", name="ck_ai_confidence"),
        CheckConstraint("warmup_auto_score IS NULL OR (warmup_auto_score BETWEEN 0 AND 4)", name="ck_warmup_auto"),
        CheckConstraint("warmup_final_score IS NULL OR (warmup_final_score BETWEEN 0 AND 4)", name="ck_warmup_final"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    participant_code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    site_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sites.id"), nullable=False)
    batch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("batches.id"), nullable=False)
    proctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("staff_users.id"), nullable=False)

    group_assignment: Mapped[enums.GroupAssignment | None] = mapped_column(
        _enum(enums.GroupAssignment, "group_assignment"), nullable=True
    )
    assignment_method: Mapped[enums.AssignmentMethod | None] = mapped_column(
        _enum(enums.AssignmentMethod, "assignment_method"), nullable=True
    )

    consent_given: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consent_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Form 0 atomic columns (nullable until Form 0 submitted)
    age_band: Mapped[enums.AgeBand | None] = mapped_column(_enum(enums.AgeBand, "age_band"), nullable=True)
    education_level: Mapped[enums.EducationLevel | None] = mapped_column(
        _enum(enums.EducationLevel, "education_level"), nullable=True
    )
    english_comfort: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    ai_use_frequency: Mapped[enums.AiUseFrequency | None] = mapped_column(
        _enum(enums.AiUseFrequency, "ai_use_frequency"), nullable=True
    )
    ai_confidence: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)

    # Warm-up
    warmup_b01_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    warmup_b02_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    warmup_b03_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    warmup_b04_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    warmup_auto_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    warmup_final_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    warmup_score_overridden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Device context (anonymity-safe; user_agent_raw never exported)
    device_category: Mapped[enums.DeviceCategory | None] = mapped_column(
        _enum(enums.DeviceCategory, "device_category"), nullable=True
    )
    os_family: Mapped[str | None] = mapped_column(String(50), nullable=True)
    browser_family: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent_raw: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[enums.ParticipantStatus] = mapped_column(
        _enum(enums.ParticipantStatus, "participant_status"), nullable=False
    )

    # Group-assignment automation (migration 0002): when Form 0 finished (start of
    # the proctor grace window) and whether the server assigned the group itself.
    form0_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    auto_assigned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class ParticipantState(Base):
    __tablename__ = "participant_states"

    participant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("participants.id", ondelete="CASCADE"), primary_key=True
    )
    current_session: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    current_step: Mapped[str] = mapped_column(String(60), nullable=False)
    draft_responses: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    unsynced_telemetry: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    break_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


# ── Analysis core ─────────────────────────────────────────────────────────────
class TaskResponse(Base, TimestampMixin):
    __tablename__ = "task_responses"
    __table_args__ = (
        UniqueConstraint("participant_id", "session_number", "task_code", name="uq_resp"),
        CheckConstraint("confidence_rating BETWEEN 1 AND 5", name="ck_confidence"),
        CheckConstraint("assistance_level IS NULL OR (assistance_level BETWEEN 0 AND 3)", name="ck_assistance_level"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    participant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("participants.id"), nullable=False)
    session_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    task_code: Mapped[str] = mapped_column(String(10), nullable=False)

    objective_answer: Mapped[str] = mapped_column(Text, nullable=False)
    objective_auto_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    text_justification: Mapped[str] = mapped_column(Text, nullable=False)

    task_familiarity: Mapped[bool] = mapped_column(Boolean, nullable=False)
    self_check: Mapped[bool] = mapped_column(Boolean, nullable=False)
    confidence_rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    control_compliance: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # AI-group Session-1 only (NULL otherwise)
    assistance_level: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    requests_count: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    copy_used: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    verified: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    verification_method: Mapped[enums.VerificationMethod | None] = mapped_column(
        _enum(enums.VerificationMethod, "verification_method"), nullable=True
    )
    verification_method_other: Mapped[str | None] = mapped_column(Text, nullable=True)
    verification_evidence: Mapped[str | None] = mapped_column(Text, nullable=True)

    duration_objective_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_justification_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_total_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    answer_change_count: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)

    participant_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Reliability: a subset is flagged for a second independent rater.
    needs_double_score: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class TelemetryLog(Base, TimestampMixin):
    __tablename__ = "telemetry_logs"
    __table_args__ = (
        Index("ix_telemetry_participant_session_event", "participant_id", "session_number", "event_type"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    # client_event_id enables idempotent re-sync (dedupe on retry). See DECISIONS D016.
    client_event_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), unique=True, nullable=False)
    participant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("participants.id"), nullable=False)
    session_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    task_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    event_type: Mapped[enums.TelemetryEventType] = mapped_column(
        _enum(enums.TelemetryEventType, "telemetry_event_type"), nullable=False
    )
    event_metadata: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    client_timestamp_ms: Mapped[int] = mapped_column(BigInteger, nullable=False)


class HintEvent(Base, TimestampMixin):
    __tablename__ = "hint_events"

    id: Mapped[uuid.UUID] = _uuid_pk()
    participant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("participants.id"), nullable=False)
    task_code: Mapped[str] = mapped_column(String(10), nullable=False)
    level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    request_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    viewed_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    copied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class ScaleResponse(Base, TimestampMixin):
    __tablename__ = "scale_responses"
    __table_args__ = (
        UniqueConstraint("participant_id", "item_code", name="uq_scale_item"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_rating"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    participant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("participants.id"), nullable=False)
    session_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    item_code: Mapped[str] = mapped_column(String(10), nullable=False)
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)


class SessionMeta(Base, TimestampMixin):
    __tablename__ = "session_meta"
    __table_args__ = (
        UniqueConstraint("participant_id", "session_number", name="uq_session_meta"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    participant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("participants.id"), nullable=False)
    session_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    transfer_prompt_used: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    transfer_prompt_text: Mapped[str | None] = mapped_column(Text, nullable=True)


class RaterScore(Base, TimestampMixin):
    __tablename__ = "rater_scores"
    __table_args__ = (
        UniqueConstraint("task_response_id", "rater_id", name="uq_rater_score"),
        CheckConstraint("correctness BETWEEN 0 AND 2", name="ck_correctness"),
        CheckConstraint("justification_quality BETWEEN 0 AND 2", name="ck_just_quality"),
        CheckConstraint("independence BETWEEN 0 AND 2", name="ck_independence"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    task_response_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("task_responses.id"), nullable=False)
    rater_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("staff_users.id"), nullable=False)
    correctness: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    justification_quality: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    independence: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_double_score: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    scored_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DeviationLog(Base, TimestampMixin):
    __tablename__ = "deviation_logs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    batch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("batches.id"), nullable=False)
    participant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("participants.id"), nullable=True)
    proctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("staff_users.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)


class Layer2Log(Base, TimestampMixin):
    __tablename__ = "layer2_logs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    participant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("participants.id"), unique=True, nullable=False)
    prompt_log_id: Mapped[str] = mapped_column(String(40), nullable=False)
    model_name_shown: Mapped[str] = mapped_column(String(60), nullable=False)
    prompt_count: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    time_in_tool_minutes: Mapped[float] = mapped_column(Numeric, nullable=False)
    copy_similarity_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    entered_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("staff_users.id"), nullable=True)
