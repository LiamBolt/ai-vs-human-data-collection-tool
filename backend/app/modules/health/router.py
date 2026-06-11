"""Health & meta endpoint."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.config import settings
from app.dependencies import DbSession

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    db: str
    version: str


@router.get("/health", response_model=HealthResponse)
async def health(db: DbSession) -> HealthResponse:
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001 — report degraded, never raise from health
        db_status = "error"
    return HealthResponse(status="ok", db=db_status, version=settings.version)
