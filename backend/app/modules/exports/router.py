"""Exports router (JWT, ADMIN or PROCTOR)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from pydantic import BaseModel

from app.dependencies import DbSession
from app.enums import StaffRole
from app.exceptions import NotFoundError
from app.modules.exports import service
from app.security import TokenClaims, require_role

StaffDep = Annotated[TokenClaims, Depends(require_role(StaffRole.ADMIN, StaffRole.PROCTOR))]

router = APIRouter(prefix="/exports", tags=["exports"])


class ExportMeta(BaseModel):
    name: str
    label: str
    row_count: int


@router.get("/meta", response_model=list[ExportMeta])
async def meta(db: DbSession, _: StaffDep) -> list[ExportMeta]:
    return [ExportMeta(**m) for m in await service.export_meta(db)]


@router.get("/{name}.csv")
async def download(name: str, db: DbSession, _: StaffDep) -> Response:
    csv_text = await service.export_csv(db, name)
    if csv_text is None:
        raise NotFoundError("Unknown export.")
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{name}.csv"'},
    )
