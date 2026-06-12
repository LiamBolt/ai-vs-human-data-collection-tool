"""Auth request/response schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.enums import StaffRole


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: StaffRole
    display_code: str


# ── Staff management (ADMIN only) ───────────────────────────────────────────────
class StaffCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    role: StaffRole
    # Optional: the Proctor/Rater ID written on forms. Auto-derived from role when omitted.
    # Must never be a real name (anonymity invariant).
    display_code: str | None = Field(default=None, max_length=20)


class StaffActiveUpdate(BaseModel):
    is_active: bool


class StaffOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    role: StaffRole
    display_code: str
    is_active: bool
    created_at: datetime
