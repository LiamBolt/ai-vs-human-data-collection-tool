#!/usr/bin/env bash
set -euo pipefail

# Stage 1: wait for the database to accept connections (Python-based, no psql needed).
echo "[startup] Waiting for database…"
python -m app.wait_for_db

# Stage 2: apply migrations. The seeder + bootstrap admin run in the app lifespan.
echo "[startup] Applying migrations…"
alembic upgrade head

# Stage 3: launch the server. Seeding + bootstrap happen in FastAPI's lifespan startup.
# Bind the platform-provided $PORT when present (Render/Fly/etc.); default to 8000 locally.
echo "[startup] Starting Uvicorn on port ${PORT:-8000}…"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
