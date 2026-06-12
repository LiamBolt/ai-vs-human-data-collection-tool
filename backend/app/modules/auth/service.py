"""Auth service — credential verification, token issuance, staff management."""
from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums import StaffRole
from app.exceptions import ConflictError, NotFoundError, UnauthorizedError
from app.models import StaffUser
from app.modules.auth.schemas import LoginRequest, LoginResponse, StaffCreate, StaffOut
from app.security import create_access_token, hash_password, login_rate_limiter, verify_password


async def login(db: AsyncSession, payload: LoginRequest) -> LoginResponse:
    login_rate_limiter.check(payload.username.lower())

    user = (
        await db.execute(select(StaffUser).where(StaffUser.username == payload.username))
    ).scalar_one_or_none()

    # Constant-ish failure path: same error whether user missing or password wrong.
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("Invalid username or password.", code="INVALID_CREDENTIALS")

    token = create_access_token(sub=str(user.id), role=user.role, display_code=user.display_code)
    return LoginResponse(access_token=token, token_type="bearer", role=user.role, display_code=user.display_code)


# ── Staff management (ADMIN only) ───────────────────────────────────────────────
async def list_staff(db: AsyncSession) -> list[StaffOut]:
    rows = (
        await db.execute(select(StaffUser).order_by(StaffUser.created_at))
    ).scalars().all()
    return [StaffOut.model_validate(r) for r in rows]


async def _next_display_code(db: AsyncSession, role: StaffRole) -> str:
    """Auto-derive an anonymous ID like PROCTOR-02 / RATER-01 from the role's count."""
    count = (
        await db.execute(
            select(func.count()).select_from(StaffUser).where(StaffUser.role == role)
        )
    ).scalar_one()
    return f"{role.value}-{count + 1:02d}"


async def create_staff(db: AsyncSession, payload: StaffCreate) -> StaffOut:
    existing = (
        await db.execute(select(StaffUser).where(StaffUser.username == payload.username))
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError("That username is already taken.", code="USERNAME_TAKEN")

    display_code = payload.display_code or await _next_display_code(db, payload.role)

    user = StaffUser(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
        display_code=display_code,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return StaffOut.model_validate(user)


async def set_staff_active(db: AsyncSession, staff_id: uuid.UUID, is_active: bool) -> StaffOut:
    user = (
        await db.execute(select(StaffUser).where(StaffUser.id == staff_id))
    ).scalar_one_or_none()
    if user is None:
        raise NotFoundError("Staff account not found.")
    user.is_active = is_active
    await db.commit()
    await db.refresh(user)
    return StaffOut.model_validate(user)
