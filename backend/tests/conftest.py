"""Pytest fixtures: test DB lifecycle, ASGI client, and seeded staff/tokens.

Requires a reachable PostgreSQL (native enums, FOR UPDATE, JSONB, ON CONFLICT).
Set TEST_DATABASE_URL (or DATABASE_URL) before running; BREAK_DURATION_SECONDS is
forced low so the break tests are fast.
"""
from __future__ import annotations

import os
import uuid

# Configure environment BEFORE importing app modules (settings is cached at import).
os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get("TEST_DATABASE_URL", "postgresql+asyncpg://aivb:changeme@localhost:5432/aivbrain_test"),
)
os.environ.setdefault("BREAK_DURATION_SECONDS", "3")
os.environ.setdefault("JWT_SECRET", "test-secret")

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402

from app.config import settings  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app import models  # noqa: F401,E402 — register tables
from app.enums import StaffRole  # noqa: E402
from app.main import app  # noqa: E402
from app.models import StaffUser  # noqa: E402
from app.security import create_access_token, hash_password  # noqa: E402
from app.seed import seed_hints, seed_tasks  # noqa: E402

engine = create_async_engine(settings.database_url, poolclass=None)
TestSession = async_sessionmaker(engine, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True)
async def _reset_schema():
    """Fresh schema + seeded instruments before each test for full isolation."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with TestSession() as db:
        await seed_tasks(db)
        await seed_hints(db)
        await db.commit()
    yield


async def _override_get_db():
    async with TestSession() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture
async def client():
    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


async def _make_staff(role: StaffRole, username: str, display_code: str) -> tuple[StaffUser, str]:
    async with TestSession() as db:
        user = StaffUser(
            username=username,
            password_hash=hash_password("pw-" + username),
            role=role,
            display_code=display_code,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        token = create_access_token(sub=str(user.id), role=role, display_code=display_code)
        return user, token


@pytest_asyncio.fixture
async def proctor():
    user, token = await _make_staff(StaffRole.PROCTOR, "proctor1", "P-01")
    return {"id": user.id, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest_asyncio.fixture
async def rater_a():
    user, token = await _make_staff(StaffRole.RATER, "raterA", "R-01")
    return {"id": user.id, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest_asyncio.fixture
async def rater_b():
    user, token = await _make_staff(StaffRole.RATER, "raterB", "R-02")
    return {"id": user.id, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest_asyncio.fixture
async def site_and_batch(proctor):
    """Create a site + batch directly and return their ids/codes."""
    from app.models import Batch, Site

    async with TestSession() as db:
        site = Site(site_code="UCU_MUKONO", site_name="UCU Mukono")
        db.add(site)
        await db.flush()
        batch = Batch(
            site_id=site.id,
            batch_code="20240101_UCU_MUKONO_BATCH01",
            batch_number=1,
            clinic_date=__import__("datetime").date(2024, 1, 1),
            layer=1,
            created_by=proctor["id"],
        )
        db.add(batch)
        await db.commit()
        return {"site_id": site.id, "site_code": site.site_code, "batch_id": batch.id}


def device_payload() -> dict:
    return {
        "device_category": "DESKTOP",
        "os_family": "Linux",
        "browser_family": "Firefox",
        "user_agent_raw": "test-agent",
    }


def new_event(event_type: str, session_number: int = 1, task_code: str | None = None) -> dict:
    return {
        "client_event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "task_code": task_code,
        "session_number": session_number,
        "client_timestamp_ms": 1234567890,
        "event_metadata": {},
    }
