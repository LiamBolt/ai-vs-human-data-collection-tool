"""FastAPI application entrypoint — lifespan (seed/bootstrap), routers, error envelope."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import AsyncSessionLocal, wait_for_db
from app.exceptions import AppError, app_error_handler, unhandled_error_handler
from app.modules.auth.router import router as auth_router
from app.modules.exports.router import router as exports_router
from app.modules.health.router import router as health_router
from app.modules.proctor.router import router as proctor_router
from app.modules.rater.router import router as rater_router
from app.modules.session.router import router as session_router
from app.seed import run_seed

logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger("aivb.main")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Migrations run in entrypoint.sh before the server starts; here we seed.
    await wait_for_db()
    async with AsyncSessionLocal() as db:
        await run_seed(db)
    logger.info("[startup] server listening")
    yield


app = FastAPI(
    title="AI vs the Brain — Data Collection API",
    version=settings.version,
    lifespan=lifespan,
)

# Dev convenience: nginx provides same-origin in production, so this is permissive.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def _app_error(request, exc):  # noqa: ANN001
    return await app_error_handler(request, exc)


@app.exception_handler(RequestValidationError)
async def _validation_error(_, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": "Request validation failed.", "details": exc.errors()}},
    )


@app.exception_handler(Exception)
async def _unhandled(request, exc):  # noqa: ANN001
    logger.exception("Unhandled error: %s", exc)
    return await unhandled_error_handler(request, exc)


# All routes live under /api/v1.
for r in (health_router, auth_router, proctor_router, session_router, rater_router, exports_router):
    app.include_router(r, prefix=settings.api_prefix)
