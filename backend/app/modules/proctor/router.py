"""Proctor / admin router (JWT, PROCTOR or ADMIN)."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.dependencies import DbSession
from app.enums import StaffRole
from app.modules.proctor import schemas, service
from app.security import TokenClaims, require_role

StaffDep = Annotated[TokenClaims, Depends(require_role(StaffRole.PROCTOR, StaffRole.ADMIN))]

router = APIRouter(tags=["proctor"])


# ── Sites ─────────────────────────────────────────────────────────────────────
@router.get("/sites", response_model=list[schemas.SiteOut])
async def list_sites(db: DbSession, _: StaffDep) -> list[schemas.SiteOut]:
    return await service.list_sites(db)


@router.post("/sites", response_model=schemas.SiteOut, status_code=status.HTTP_201_CREATED)
async def create_site(payload: schemas.SiteCreate, db: DbSession, _: StaffDep) -> schemas.SiteOut:
    return await service.create_site(db, payload)


# ── Batches ───────────────────────────────────────────────────────────────────
@router.get("/batches", response_model=list[schemas.BatchOut])
async def list_batches(db: DbSession, _: StaffDep) -> list[schemas.BatchOut]:
    return await service.list_batches(db)


@router.post("/batches", response_model=schemas.BatchOut, status_code=status.HTTP_201_CREATED)
async def create_batch(payload: schemas.BatchCreate, db: DbSession, staff: StaffDep) -> schemas.BatchOut:
    return await service.create_batch(db, payload, uuid.UUID(staff.sub))


# ── Check-in & assignment ─────────────────────────────────────────────────────
@router.post(
    "/participants/check-in",
    response_model=schemas.CheckInResponse,
    status_code=status.HTTP_201_CREATED,
)
async def check_in(payload: schemas.CheckInRequest, db: DbSession, staff: StaffDep) -> schemas.CheckInResponse:
    return await service.check_in(db, payload, uuid.UUID(staff.sub))


@router.get("/participants/awaiting-count", response_model=schemas.AwaitingCountOut)
async def awaiting_count(db: DbSession, _: StaffDep) -> schemas.AwaitingCountOut:
    return schemas.AwaitingCountOut(count=await service.awaiting_assignment_count(db))


@router.get("/participants/{participant_id}/assignment-suggestion", response_model=schemas.AssignmentSuggestion)
async def assignment_suggestion(participant_id: uuid.UUID, db: DbSession, _: StaffDep) -> schemas.AssignmentSuggestion:
    return await service.assignment_suggestion(db, participant_id)


@router.post("/participants/{participant_id}/assignment", response_model=schemas.AssignmentSuggestion)
async def set_assignment(
    participant_id: uuid.UUID, payload: schemas.AssignmentRequest, db: DbSession, _: StaffDep
) -> schemas.AssignmentSuggestion:
    return await service.set_assignment(db, participant_id, payload)


@router.patch("/participants/{participant_id}/warmup-override", status_code=status.HTTP_204_NO_CONTENT)
async def warmup_override(
    participant_id: uuid.UUID, payload: schemas.WarmupOverrideRequest, db: DbSession, _: StaffDep
):
    await service.override_warmup(db, participant_id, payload.score)
    return None


# ── Deviations / Layer 2 ──────────────────────────────────────────────────────
@router.post("/deviations", status_code=status.HTTP_201_CREATED)
async def create_deviation(payload: schemas.DeviationRequest, db: DbSession, staff: StaffDep) -> dict:
    await service.create_deviation(db, payload, uuid.UUID(staff.sub))
    return {"status": "created"}


@router.post("/layer2-logs", status_code=status.HTTP_201_CREATED)
async def create_layer2(payload: schemas.Layer2Request, db: DbSession, staff: StaffDep) -> dict:
    await service.create_layer2(db, payload, uuid.UUID(staff.sub))
    return {"status": "created"}


# ── Monitor ───────────────────────────────────────────────────────────────────
@router.get("/batches/{batch_id}/monitor", response_model=list[schemas.MonitorRow])
async def monitor(batch_id: uuid.UUID, db: DbSession, _: StaffDep) -> list[schemas.MonitorRow]:
    return await service.monitor(db, batch_id)
