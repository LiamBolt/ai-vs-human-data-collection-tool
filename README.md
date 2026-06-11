# AI vs the Brain — Data Collection Platform

A research-grade, **offline-first** platform that digitizes a fixed experimental protocol
(Forms 0/1A/1B/3, post-block scales, an Offline Hint Bank, blinded rubric scoring, and a
proctor deviation log) and captures behavioral telemetry for COI/HES analysis.

- **Frontend:** React 18 + TypeScript (strict) + Vite + Tailwind, Zustand + TanStack Query, self-hosted Inter. Light/dark themes, glassmorphic UI.
- **Backend:** FastAPI (async) + SQLAlchemy 2.0 + asyncpg + Alembic, PostgreSQL 16.
- **Serving:** nginx serves the built SPA and proxies `/api/` to the backend (same-origin, no CORS in prod).

> The single source of truth for **what** to build is `MEGA_PROMPT.md`. Conduct rules are in `CLAUDE.md`. Ambiguity resolutions are logged in `DECISIONS.md`.

---

## Quick start (LAN island, no internet)

From a clean clone on the host:

```bash
cp .env.example .env          # then set DATABASE_URL + secrets (see below)
docker compose up -d --build
```

Services:

| Service    | Image                     | Purpose                                                  |
|------------|---------------------------|----------------------------------------------------------|
| `backend`  | python:3.12-slim          | FastAPI API — migrations + seed run on startup           |
| `frontend` | nginx:stable-alpine       | Serves the SPA, proxies `/api/` → `backend:8000`         |
| `db`       | postgres:16-alpine        | **Optional** local Postgres — only with `--profile localdb` |

By default the backend uses the **managed `DATABASE_URL`** from `.env` (e.g. Neon — see below), so no local
database is needed. To run a self-contained local Postgres instead, start with
`docker compose --profile localdb up -d --build` and point `DATABASE_URL` at `db`.

On startup the backend logs: `DB ready → migrations applied → seed verified → server listening`,
seeds the instruments (tasks + hints, verbatim from Module D), and bootstraps an **ADMIN** account
from `ADMIN_BOOTSTRAP_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD` if no staff exist.

### Using Neon (or any managed Postgres)

Paste the provider's connection string into `.env` as-is — the app normalizes it automatically
(forces the `asyncpg` driver, strips libpq-only params like `sslmode`/`channel_binding`, enables TLS,
and uses PgBouncer-safe pooling for Neon's `-pooler` endpoint):

```bash
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

`.env` is git-ignored — **never commit real credentials**. On first start the backend creates the schema
and seeds instruments directly in your Neon database.

Then, from any device on the same LAN, open:

```
http://<clinic-host-LAN-IP>/
```

- Participants: enter the Participant ID the proctor hands them.
- Proctor/Admin: `http://<host>/proctor/login`
- Rater (blinded): `http://<host>/rater/login`

Health check: `GET http://<host>/api/v1/health` → `{"status":"ok","db":"ok",...}`.

---

## Proctor quickstart

1. **Sign in** at `/proctor/login` with the bootstrap admin (or a created proctor account).
2. **Sites & Batches** — create a site, then a batch (`Batches` screen).
3. **Check-in** — pick the batch, confirm consent, **Generate Participant ID**. Hand the code to the participant.
4. The participant completes **Consent → Form 0** on their device.
5. Back on Check-in, the **assignment card** appears once Form 0 is submitted (stratified suggestion by education × AI-use). **Accept** or **Override** (override needs a one-line reason → logged as a deviation).
6. **Monitor** — live roster (status, current step, last sync age, infractions, warm-up score with inline override).
7. After sessions: **Layer 2** entry (calibration batches), **Deviations** log, **Exports** (CSV suite + data dictionary).

---

## Environment variables (`.env`)

| Variable | Default | Notes |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `aivb` / `changeme` / `aivbrain` | DB credentials |
| `DATABASE_URL` | `postgresql+asyncpg://aivb:changeme@db:5432/aivbrain` | async driver |
| `JWT_SECRET` | (change me) | HS256 signing secret |
| `JWT_EXPIRES_MIN` | `720` | token lifetime |
| `BREAK_DURATION_SECONDS` | `300` | server-anchored break length |
| `ADMIN_BOOTSTRAP_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD` | `admin` / `changeme-admin` | first-run admin |

**Anonymity:** no names, phones, emails, IPs, MACs, or geolocation are ever stored. The only identity key is `participant_code`. nginx does not forward client IPs to anything persisted, and `user_agent_raw` is never included in analysis CSV exports.

---

## Development

### Frontend (with mock backend)
```bash
cd frontend
npm install
npm run setup:msw     # writes public/mockServiceWorker.js
npm run dev           # http://localhost:5173 — full flow via MSW mocks
npm test              # Vitest component tests
npm run build         # tsc + vite build
```

### Backend (against a local Postgres)
```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql+asyncpg://aivb:changeme@localhost:5432/aivbrain
alembic upgrade head
uvicorn app.main:app --reload     # http://localhost:8000/api/v1/health
```

### Tests
```bash
# Backend (needs a reachable Postgres; uses TEST_DATABASE_URL or DATABASE_URL)
cd backend
TEST_DATABASE_URL=postgresql+asyncpg://aivb:changeme@localhost:5432/aivbrain_test pytest

# End-to-end smoke / demo (run against the compose stack with a short break)
BREAK_DURATION_SECONDS=3 E2E_BASE_URL=http://localhost/api/v1 python scripts/e2e_smoke.py
```

---

## Data exports

`Exports` (ADMIN/PROCTOR) streams ten CSVs plus a generated data dictionary:
`participants`, `task_responses`, `telemetry_events`, `hint_events`, `scale_responses`,
`rater_scores`, `session_meta`, `deviation_logs`, `layer2_logs`, `data_dictionary`.

Every CSV is tidy (one observation per row, atomic typed columns), carries `participant_code`
(plus `session_number` / `task_code` where applicable) for pandas merges, and excludes
`user_agent_raw`. `data_dictionary.csv` documents every exported column.

---

## Hosting (GitHub → a server)

Yes — committing to GitHub makes hosting straightforward, **as long as secrets stay out of the repo**
(`.env` is git-ignored; set real values as host/platform environment variables or secrets).

**Recommended: a single container host (VPS) + Neon.**
1. Push the repo to GitHub (the working tree already excludes `.env`).
2. On a Docker-capable host (DigitalOcean / Hetzner / EC2 / Fly Machines):
   ```bash
   git clone <your-repo> && cd ai-vs-human-data-collection-tool
   cp .env.example .env     # set DATABASE_URL (Neon), JWT_SECRET, ADMIN_BOOTSTRAP_*
   docker compose up -d --build
   ```
   The frontend serves on port 80 and proxies `/api/` to the backend; Neon is the database.
3. Put a TLS terminator (Caddy / nginx / the platform's load balancer) in front for HTTPS.

**Alternative: split hosting.** Frontend as static files (Netlify / Vercel / GitHub Pages) with the API
base pointed at a separately hosted backend (Render / Railway / Fly.io running `backend/Dockerfile`),
plus Neon for the database. Set each platform's env vars from `.env.example`.

**Always** rotate any credential that has appeared outside the repo (e.g. pasted into chat or a PR),
and generate a strong `JWT_SECRET` and `ADMIN_BOOTSTRAP_PASSWORD` per environment.

> Build/runtime networking note: container builds need outbound access to PyPI, and the running backend
> needs outbound access to your database. On a normal cloud host this works out of the box. If you are on
> a machine whose Docker **bridge network lacks internet egress/DNS**, build with `docker build --network=host`
> and run the backend with `--network host` (or fix the daemon's DNS) so the container can reach PyPI and the DB.
