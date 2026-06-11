"""Rater router (JWT, RATER role only)."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.dependencies import DbSession
from app.enums import StaffRole
from app.modules.rater import schemas, service
from app.security import TokenClaims, require_role

RaterDep = Annotated[TokenClaims, Depends(require_role(StaffRole.RATER))]

router = APIRouter(prefix="/rater", tags=["rater"])


@router.get("/queue", response_model=list[schemas.RaterQueueItem])
async def queue(db: DbSession, rater: RaterDep) -> list[schemas.RaterQueueItem]:
    return await service.queue(db, uuid.UUID(rater.sub))


@router.post("/scores", status_code=status.HTTP_201_CREATED)
async def submit_score(payload: schemas.RaterScoreRequest, db: DbSession, rater: RaterDep) -> dict:
    await service.submit_score(db, uuid.UUID(rater.sub), payload)
    return {"status": "created"}
