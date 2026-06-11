"""Auth router."""
from __future__ import annotations

from fastapi import APIRouter

from app.dependencies import DbSession
from app.modules.auth import service
from app.modules.auth.schemas import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: DbSession) -> LoginResponse:
    return await service.login(db, payload)
