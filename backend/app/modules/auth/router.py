"""Auth router — login plus ADMIN-only staff management."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.dependencies import DbSession
from app.enums import StaffRole
from app.modules.auth import service
from app.modules.auth.schemas import (
    LoginRequest,
    LoginResponse,
    StaffActiveUpdate,
    StaffCreate,
    StaffOut,
)
from app.security import TokenClaims, require_role

router = APIRouter(prefix="/auth", tags=["auth"])

AdminDep = Annotated[TokenClaims, Depends(require_role(StaffRole.ADMIN))]


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: DbSession) -> LoginResponse:
    return await service.login(db, payload)


# ── Staff management (ADMIN only) ───────────────────────────────────────────────
@router.get("/staff", response_model=list[StaffOut])
async def list_staff(db: DbSession, _: AdminDep) -> list[StaffOut]:
    return await service.list_staff(db)


@router.post("/staff", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
async def create_staff(payload: StaffCreate, db: DbSession, _: AdminDep) -> StaffOut:
    return await service.create_staff(db, payload)


@router.patch("/staff/{staff_id}", response_model=StaffOut)
async def update_staff_active(
    staff_id: uuid.UUID, payload: StaffActiveUpdate, db: DbSession, _: AdminDep
) -> StaffOut:
    return await service.set_staff_active(db, staff_id, payload.is_active)
