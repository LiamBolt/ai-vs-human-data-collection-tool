"""Async SQLAlchemy engine, session factory, and declarative base."""
from __future__ import annotations

import asyncio
import logging
import ssl as ssl_lib
from collections.abc import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from sqlalchemy import text

from app.config import settings

logger = logging.getLogger("aivb.database")


def _build_engine_args(raw_url: str) -> tuple[str, dict]:
    """Normalize a DB URL for SQLAlchemy + asyncpg.

    Handles managed Postgres (e.g. Neon): forces the asyncpg driver, strips
    libpq-only query params (sslmode, channel_binding) that asyncpg rejects,
    enables TLS, and — for PgBouncer pooler endpoints — disables the prepared
    statement cache and our own connection pool (let the pooler manage them).
    """
    parts = urlsplit(raw_url)
    scheme = parts.scheme
    if scheme in ("postgres", "postgresql"):
        scheme = "postgresql+asyncpg"

    query = dict(parse_qsl(parts.query))
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)  # asyncpg does not accept this kwarg
    clean_url = urlunsplit((scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

    host = parts.hostname or ""
    is_managed = "neon.tech" in host or "pooler" in host
    needs_ssl = is_managed or sslmode in ("require", "verify-ca", "verify-full", "prefer", "allow")

    kwargs: dict = {"echo": False}
    connect_args: dict = {}

    if needs_ssl:
        ctx = ssl_lib.create_default_context()
        # Traffic is encrypted; Neon terminates TLS at the pooler. We skip cert
        # verification to avoid environment-specific CA issues on the LAN host.
        ctx.check_hostname = False
        ctx.verify_mode = ssl_lib.CERT_NONE
        connect_args["ssl"] = ctx

    if is_managed:
        # PgBouncer transaction pooling is incompatible with cached prepared statements.
        connect_args["statement_cache_size"] = 0
        kwargs["poolclass"] = NullPool
    else:
        kwargs["pool_pre_ping"] = True

    if connect_args:
        kwargs["connect_args"] = connect_args
    return clean_url, kwargs


_clean_url, _engine_kwargs = _build_engine_args(settings.database_url)
engine = create_async_engine(_clean_url, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding a request-scoped async session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def wait_for_db(max_seconds: int = 60) -> None:
    """Block (with exponential backoff) until the database accepts a SELECT 1."""
    delay = 1.0
    waited = 0.0
    last_error: Exception | None = None
    while waited < max_seconds:
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info("[startup] DB ready")
            return
        except Exception as exc:  # noqa: BLE001 — startup probe, must keep retrying
            last_error = exc
            await asyncio.sleep(delay)
            waited += delay
            delay = min(delay * 2, 8.0)
    raise RuntimeError(f"Database not reachable after {max_seconds}s: {last_error}")
