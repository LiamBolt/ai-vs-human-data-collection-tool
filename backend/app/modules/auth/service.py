"""Auth service — credential verification and token issuance."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import UnauthorizedError
from app.models import StaffUser
from app.modules.auth.schemas import LoginRequest, LoginResponse
from app.security import create_access_token, login_rate_limiter, verify_password


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
