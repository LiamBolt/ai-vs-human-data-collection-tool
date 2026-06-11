"""Auth request/response schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.enums import StaffRole


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: StaffRole
    display_code: str
