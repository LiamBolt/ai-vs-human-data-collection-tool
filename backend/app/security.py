"""Password hashing, JWT issuance/verification, and role-guard dependencies."""
from __future__ import annotations

import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.config import settings
from app.enums import StaffRole
from app.exceptions import ForbiddenError, RateLimitError, UnauthorizedError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


class TokenClaims(BaseModel):
    sub: str  # staff_user id
    role: StaffRole
    display_code: str


def create_access_token(*, sub: str, role: StaffRole, display_code: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "role": role.value,
        "display_code": display_code,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_expires_min)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> TokenClaims:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return TokenClaims(
            sub=payload["sub"],
            role=StaffRole(payload["role"]),
            display_code=payload["display_code"],
        )
    except (JWTError, KeyError, ValueError) as exc:
        raise UnauthorizedError("Invalid or expired token.") from exc


async def get_current_staff(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> TokenClaims:
    if credentials is None or not credentials.credentials:
        raise UnauthorizedError("Authentication required.")
    return decode_token(credentials.credentials)


def require_role(*roles: StaffRole):
    """Dependency factory enforcing that the caller holds one of the given roles."""

    allowed = set(roles)

    async def _dependency(
        staff: Annotated[TokenClaims, Depends(get_current_staff)],
    ) -> TokenClaims:
        if staff.role not in allowed:
            raise ForbiddenError("You do not have access to this resource.")
        return staff

    return _dependency


# ── Simple in-memory login rate limiter (LAN-grade; resets on process restart) ──
class LoginRateLimiter:
    def __init__(self, max_attempts: int = 10, window_seconds: int = 60) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str) -> None:
        now = time.monotonic()
        cutoff = now - self.window_seconds
        hits = [t for t in self._hits[key] if t > cutoff]
        if len(hits) >= self.max_attempts:
            raise RateLimitError("Too many login attempts. Please wait and try again.")
        hits.append(now)
        self._hits[key] = hits


login_rate_limiter = LoginRateLimiter()
