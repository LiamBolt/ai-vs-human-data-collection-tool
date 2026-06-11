"""Python enums mirroring the PostgreSQL native enums.

Names here are the *enum value strings* stored in the DB and exchanged over the API.
"""
from __future__ import annotations

import enum


class StaffRole(str, enum.Enum):
    PROCTOR = "PROCTOR"
    RATER = "RATER"
    ADMIN = "ADMIN"


class GroupAssignment(str, enum.Enum):
    CONTROL = "CONTROL"
    AI_ASSISTED = "AI_ASSISTED"


class AssignmentMethod(str, enum.Enum):
    SUGGESTED_ACCEPTED = "SUGGESTED_ACCEPTED"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"


class AgeBand(str, enum.Enum):
    AGE_18_24 = "18_24"
    AGE_25_34 = "25_34"
    AGE_35_44 = "35_44"
    AGE_45_PLUS = "45_PLUS"


class EducationLevel(str, enum.Enum):
    SECONDARY = "SECONDARY"
    DIPLOMA = "DIPLOMA"
    DEGREE = "DEGREE"
    POSTGRAD = "POSTGRAD"


class AiUseFrequency(str, enum.Enum):
    NEVER = "NEVER"
    MONTHLY = "MONTHLY"
    WEEKLY = "WEEKLY"
    DAILY = "DAILY"


class DeviceCategory(str, enum.Enum):
    DESKTOP = "DESKTOP"
    MOBILE = "MOBILE"
    TABLET = "TABLET"


class ParticipantStatus(str, enum.Enum):
    CHECKED_IN = "CHECKED_IN"
    FORM0 = "FORM0"
    SESSION1 = "SESSION1"
    BREAK = "BREAK"
    SESSION2 = "SESSION2"
    SCALES_S2 = "SCALES_S2"
    COMPLETED = "COMPLETED"
    WITHDRAWN = "WITHDRAWN"


class AnswerType(str, enum.Enum):
    NUMERIC = "NUMERIC"
    YES_NO = "YES_NO"
    TEXT = "TEXT"


class VerificationMethod(str, enum.Enum):
    RECOMPUTE = "RECOMPUTE"
    ESTIMATE = "ESTIMATE"
    ALT_METHOD = "ALT_METHOD"
    CONSISTENCY = "CONSISTENCY"
    OTHER = "OTHER"


class TelemetryEventType(str, enum.Enum):
    PASTE = "PASTE"
    PASTE_BLOCKED = "PASTE_BLOCKED"
    TAB_BLUR = "TAB_BLUR"
    TAB_FOCUS = "TAB_FOCUS"
    ANSWER_REVISION = "ANSWER_REVISION"
    HINT_UNLOCK = "HINT_UNLOCK"
    HINT_COPY = "HINT_COPY"
    INFRACTION = "INFRACTION"
    BREAK_START = "BREAK_START"
    BREAK_END = "BREAK_END"
    SESSION_START = "SESSION_START"
    SESSION_END = "SESSION_END"


class TimingMode(str, enum.Enum):
    PER_TASK = "PER_TASK"
    BLOCK = "BLOCK"
