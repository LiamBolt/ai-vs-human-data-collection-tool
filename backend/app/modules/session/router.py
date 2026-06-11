"""Participant-flow router (no auth — keyed by participant_code + server state machine)."""
from __future__ import annotations

from fastapi import APIRouter, Query, status

from app.dependencies import DbSession
from app.modules.session import schemas, service

router = APIRouter(tags=["session"])


@router.post("/session/resume", response_model=schemas.ResumeResponse)
async def resume(payload: schemas.ResumeRequest, db: DbSession) -> schemas.ResumeResponse:
    return await service.resume(db, payload)


@router.patch("/session/state", status_code=status.HTTP_204_NO_CONTENT)
async def sync_state(payload: schemas.StateSyncRequest, db: DbSession):
    await service.sync_state(db, payload)
    return None


@router.post("/form0/submit", response_model=schemas.Form0Response)
async def submit_form0(payload: schemas.Form0Request, db: DbSession) -> schemas.Form0Response:
    return await service.submit_form0(db, payload)


@router.post("/tasks/{task_code}/submit", response_model=schemas.TaskSubmitResponse)
async def submit_task(
    task_code: str, payload: schemas.TaskSubmitRequest, db: DbSession
) -> schemas.TaskSubmitResponse:
    return await service.submit_task(db, task_code, payload)


@router.post("/hints/request", response_model=schemas.HintResponse)
async def request_hint(payload: schemas.HintRequest, db: DbSession) -> schemas.HintResponse:
    return await service.request_hint(db, payload)


@router.post("/break/start", response_model=schemas.BreakStartResponse)
async def start_break(payload: schemas.BreakStartRequest, db: DbSession) -> schemas.BreakStartResponse:
    return await service.start_break(db, payload)


@router.get("/break/status", response_model=schemas.BreakStatusResponse)
async def break_status(db: DbSession, participant_code: str = Query(...)) -> schemas.BreakStatusResponse:
    return await service.break_status(db, participant_code)


@router.post("/break/complete", status_code=status.HTTP_204_NO_CONTENT)
async def complete_break(payload: schemas.BreakCompleteRequest, db: DbSession):
    await service.complete_break(db, payload)
    return None


@router.post("/scales/submit", status_code=status.HTTP_201_CREATED)
async def submit_scales(payload: schemas.ScaleSubmitRequest, db: DbSession) -> dict:
    await service.submit_scales(db, payload)
    return {"status": "created"}


@router.post("/session2/transfer-prompt", status_code=status.HTTP_201_CREATED)
async def submit_transfer(payload: schemas.TransferRequest, db: DbSession) -> dict:
    await service.submit_transfer(db, payload)
    return {"status": "created"}
