# MEGA PROMPT — "AI vs the Brain" Data Collection Platform
## Build Specification for Claude Code (Implementation Agent)

You are an elite full-stack engineering agent (Architect + Senior FastAPI Engineer + Senior React Engineer + Modern UI Design Expert in one). You will build, from zero to fully working, a research-grade digital data collection platform for the study **"AI vs the Brain: A Data Science Framework that Measures AI Reliance and Human Engagement in Problem Solving."**

This is not a generic form app. It is a **scientific instrument**. It digitizes a fixed experimental protocol (Forms 0, 1A, 1B, 3, post-block scales, an Offline Hint Bank, a rubric scoring sheet, and a proctor deviation log) and captures a behavioral telemetry footprint that downstream analysts will use to compute a Cognitive Offloading Index (COI) and Human Engagement Score (HES). Every field name, every option label, every task text, and every hint text in Module D is **verbatim from the researcher's instruments and must not be reworded, reordered, or "improved."** The science depends on standardization.

Work through the modules in the order given by Module G (Implementation Phases). Do not skip phases. Do not mark a phase complete until its Verification Gate passes. Never leave TODO comments, placeholder functions, mocked endpoints, or lorem ipsum anywhere in the final code.

---

## 0. HARD CONSTRAINTS (apply to every line of code — violations are build failures)

1. **OFFLINE-FIRST, ALWAYS.** Clinics run with **no internet**. The entire stack must function on an isolated LAN. Therefore:
   - NO CDN links of any kind (no Google Fonts, no unpkg, no jsdelivr, no cdnjs).
   - Inter font is self-hosted via the `@fontsource/inter` npm package (weights 400, 500, 600, 700), imported in the frontend entry file.
   - No external API calls from frontend or backend. No analytics, no error-reporting SaaS, no live AI APIs.
   - All npm/pip dependencies are installed at image build time and baked into the Docker images.
2. **ANONYMITY IS ABSOLUTE.** Never collect, log, or store: names, phone numbers, email addresses, IP addresses, MAC addresses, geolocation, or any personal identifier. The only identity key is the generated `participant_id`. Backend access logs must not persist client IPs into the database. Device context is limited to: `device_category` (DESKTOP | MOBILE | TABLET), `os_family`, `browser_family`, `user_agent_raw` (for debugging only, never exported in analysis CSVs).
3. **TIDY DATA.** One observation per row, one variable per column, atomic typed columns for every analysis variable. JSONB is allowed ONLY for telemetry `event_metadata` and draft snapshots — never for analysis endpoints (answers, timers, confidence, levels, flags all get real columns).
4. **DETERMINISTIC INSTRUMENTS.** Seed content (Module D) is loaded by an idempotent seeding script. The app renders instruments from the database, not from hardcoded JSX strings, so the researcher can audit content in one place. Seed values must match Module D character-for-character.
5. **NO SCOPE INVENTION.** Do not add features not specified here (no email, no notifications, no i18n, no theming toggle — the dark theme is the only theme). If something is ambiguous, choose the simplest interpretation consistent with the study protocol and write your decision in `DECISIONS.md` at the repo root.
6. **PINNED STACK.** Use exactly: React 18.3.x, TypeScript 5.5.x, Vite 5.x, Tailwind CSS 3.4.x, Zustand 4.x, TanStack Query 5.x, React Router 6.x, @fontsource/inter; Python 3.12, FastAPI 0.115.x, Pydantic v2, SQLAlchemy 2.0 (async) + asyncpg, Alembic, Uvicorn, python-jose (JWT), passlib[bcrypt]; PostgreSQL 16; nginx (stable-alpine) serving the built frontend; Docker Compose v2. Pin exact versions in lockfiles.
7. **EVERY KEYSTROKE SURVIVES.** Dual-layer persistence (localStorage mirror + 30s background server sync) is mandatory on every participant screen. A power cut at any moment must lose at most 30 seconds of unsynced telemetry and zero committed answers.
8. **SESSION 2 IS SACRED.** AI is removed for everyone in Session 2. The hint widget must be impossible to render in Session 2 (guard at the route level AND the API level: the hint endpoints reject any request where the participant's current session is 2, with HTTP 403 and an audit log entry).

---

## MODULE A — ARCHITECT (monorepo, Docker, environment, networking)

### A1. Repository layout (monorepo, exactly this tree at the top level)

```
/
├── docker-compose.yml
├── .env.example
├── README.md                 # setup, LAN deployment guide, proctor quickstart
├── DECISIONS.md              # agent-recorded ambiguity resolutions
├── CLAUDE.md                 # agent operating rules (already provided)
├── frontend/
│   ├── Dockerfile            # multi-stage: node:20-alpine build → nginx:stable-alpine serve
│   ├── nginx.conf            # SPA fallback, /api proxy to backend, gzip, cache headers
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/...
└── backend/
    ├── Dockerfile            # python:3.12-slim
    ├── pyproject.toml or requirements.txt (pinned)
    ├── alembic/
    └── app/...
```

### A2. docker-compose.yml requirements

- Three services on one bridge network: `db` (postgres:16-alpine), `backend`, `frontend`.
- `db`: named volume `pgdata`, healthcheck `pg_isready -U $POSTGRES_USER`, restart unless-stopped.
- `backend`: `depends_on: db: condition: service_healthy`; healthcheck hits `GET /api/v1/health`; on startup runs `alembic upgrade head` then the idempotent seeder, then uvicorn. If the DB is briefly unavailable, retry with exponential backoff (max ~60s) instead of crashing.
- `frontend`: nginx listens on port 80, published as `80:80` on the host so any device on the LAN reaches the app at `http://<host-LAN-IP>/`. nginx proxies `/api/` to `backend:8000` (this removes all CORS complexity in production; still configure permissive same-origin CORS in FastAPI for dev).
- All config via environment variables with safe defaults in `.env.example`: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_MIN` (default 720), `BREAK_DURATION_SECONDS` (default 300), `ADMIN_BOOTSTRAP_USERNAME`, `ADMIN_BOOTSTRAP_PASSWORD`.
- `docker compose up -d --build` from a clean clone must yield a fully working system with seeded instruments and a bootstrap proctor-admin account. This is Acceptance Test #1.

### A3. nginx.conf requirements

- `try_files $uri /index.html;` SPA fallback.
- `location /api/ { proxy_pass http://backend:8000/api/; }` with standard proxy headers, but DO NOT forward `X-Forwarded-For` into anything the backend persists.
- gzip on for text assets; immutable cache headers for hashed assets; `no-store` for `index.html`.

### A4. Backend startup resilience

Implement a small `wait_for_db` routine (async loop with backoff) used before migrations. Log clear startup stages: `DB ready → migrations applied → seed verified → server listening`.

---

## MODULE B — BACKEND ENGINEER (FastAPI + PostgreSQL)

Follow the FastAPI module layout: `app/main.py`, `app/config.py` (Pydantic BaseSettings), `app/database.py` (async engine + session factory), `app/dependencies.py`, `app/exceptions.py`, and feature modules under `app/modules/` each with `router.py`, `service.py`, `repository.py`, `schemas.py`, `models.py`. Async everywhere. Every endpoint has a typed Pydantic request and response model and appears fully documented in OpenAPI.

### B1. Database schema (PostgreSQL 16, SQLAlchemy 2.0 models + Alembic migration)

All tables get `created_at TIMESTAMPTZ DEFAULT now()`. Use UUID primary keys (`gen_random_uuid()`) except where noted. Enums are PostgreSQL native enums.

**sites** — `id UUID PK`, `site_code VARCHAR(50) UNIQUE NOT NULL` (e.g. "UCU_MUKONO"), `site_name TEXT NOT NULL`.

**batches** — `id UUID PK`, `site_id FK→sites`, `batch_code VARCHAR(60) UNIQUE NOT NULL` formatted `YYYYMMDD_SITE_BATCH##`, `clinic_date DATE NOT NULL`, `layer SMALLINT NOT NULL DEFAULT 1` (1 = Offline Hint Bank, 2 = Live ChatGPT calibration subset), `timing_mode VARCHAR(10) NOT NULL DEFAULT 'PER_TASK'` (PER_TASK | BLOCK), `created_by FK→staff_users`.

**staff_users** — `id UUID PK`, `username VARCHAR(50) UNIQUE NOT NULL`, `password_hash TEXT NOT NULL` (bcrypt), `role` enum (`PROCTOR`, `RATER`, `ADMIN`), `display_code VARCHAR(20) NOT NULL` (the Proctor ID / Rater ID written on forms — never a real name), `is_active BOOLEAN DEFAULT true`.

**participants** —
- `id UUID PK`
- `participant_code VARCHAR(40) UNIQUE NOT NULL` — generated sequentially per batch as `{SITE_CODE}-{BATCH##}-{####}` with a zero-padded 4-digit counter; generation must be race-safe (use a `SELECT ... FOR UPDATE` on a per-batch counter row or a sequence per batch).
- `site_id FK→sites NOT NULL`, `batch_id FK→batches NOT NULL`, `proctor_id FK→staff_users NOT NULL`
- `group_assignment` enum (`CONTROL`, `AI_ASSISTED`) NOT NULL
- `assignment_method` enum (`SUGGESTED_ACCEPTED`, `MANUAL_OVERRIDE`) NOT NULL
- `consent_given BOOLEAN NOT NULL`, `consent_timestamp TIMESTAMPTZ NOT NULL` (participant cannot exist without consent)
- Form 0 atomic columns: `age_band` enum (`18_24`,`25_34`,`35_44`,`45_PLUS`); `education_level` enum (`SECONDARY`,`DIPLOMA`,`DEGREE`,`POSTGRAD`); `english_comfort SMALLINT CHECK 1..5`; `ai_use_frequency` enum (`NEVER`,`MONTHLY`,`WEEKLY`,`DAILY`); `ai_confidence SMALLINT CHECK 1..5`
- Baseline warm-up: `warmup_b01_answer TEXT`, `warmup_b02_answer TEXT`, `warmup_b03_answer TEXT`, `warmup_b04_answer TEXT`, `warmup_auto_score SMALLINT CHECK 0..4`, `warmup_final_score SMALLINT CHECK 0..4` (proctor-overridable; defaults to auto), `warmup_score_overridden BOOLEAN DEFAULT false`
- Device context: `device_category` enum (`DESKTOP`,`MOBILE`,`TABLET`), `os_family VARCHAR(50)`, `browser_family VARCHAR(50)`, `user_agent_raw TEXT`
- `status` enum (`CHECKED_IN`,`FORM0`,`SESSION1`,`BREAK`,`SESSION2`,`SCALES_S2`,`COMPLETED`,`WITHDRAWN`)

**participant_states** — single live row per participant for crash recovery: `participant_id UUID PK FK→participants ON DELETE CASCADE`, `current_session SMALLINT NOT NULL DEFAULT 1`, `current_step VARCHAR(60) NOT NULL` (e.g. `form0`, `s1_task_A1`, `break`, `s2_task_B4`, `scales_s2`), `draft_responses JSONB NOT NULL DEFAULT '{}'`, `unsynced_telemetry JSONB NOT NULL DEFAULT '[]'`, `break_ends_at TIMESTAMPTZ NULL` (server-anchored break target), `updated_at TIMESTAMPTZ`.

**tasks** (seeded instrument content) — `id UUID PK`, `task_code VARCHAR(10) UNIQUE NOT NULL` (A1, A2, B1, B2, C1, C2, A3, A4, B3, B4), `session_number SMALLINT NOT NULL`, `display_order SMALLINT NOT NULL`, `family TEXT NOT NULL`, `objective_question TEXT NOT NULL`, `justification_prompt TEXT NOT NULL`, `answer_type` enum (`NUMERIC`,`YES_NO`,`TEXT`), `correct_answer TEXT NOT NULL` (answer key, fixed in advance), `answer_tolerance NUMERIC NULL` (e.g. 0.5 for A4 142.5), `parallel_to VARCHAR(10) NULL` (A3→A1, A4→A2, B3→B1, B4→B2).

**hints** (seeded) — `id UUID PK`, `task_code FK→tasks.task_code`, `level SMALLINT CHECK (level IN (1,2,3))`, `hint_text TEXT NOT NULL`, UNIQUE (task_code, level). Hints exist only for Session 1 tasks.

**task_responses** — the analysis core, fully tidy:
- `id UUID PK`, `participant_id FK NOT NULL`, `session_number SMALLINT NOT NULL`, `task_code VARCHAR(10) NOT NULL`
- `objective_answer TEXT NOT NULL`, `objective_auto_correct BOOLEAN NOT NULL` (scored against answer key at submit time)
- `text_justification TEXT NOT NULL` (min 30 chars enforced server-side too)
- `task_familiarity BOOLEAN NOT NULL`, `self_check BOOLEAN NOT NULL`, `confidence_rating SMALLINT NOT NULL CHECK 1..5`
- `control_compliance BOOLEAN NULL` (control group Session 1 only: "I did not use AI..." attestation)
- AI-group Session 1 columns (NULL for control / Session 2): `assistance_level SMALLINT CHECK 0..3`, `requests_count SMALLINT`, `copy_used BOOLEAN`, `verified BOOLEAN`, `verification_method` enum (`RECOMPUTE`,`ESTIMATE`,`ALT_METHOD`,`CONSISTENCY`,`OTHER`) NULL, `verification_method_other TEXT NULL`, `verification_evidence TEXT NULL` (required non-empty when verified = true)
- Split timers (ms, INT NOT NULL): `duration_objective_ms`, `duration_justification_ms`, `duration_total_ms`; plus `answer_change_count SMALLINT NOT NULL DEFAULT 0` (denormalized convenience; full sequence lives in telemetry)
- `participant_notes TEXT NULL`, `submitted_at TIMESTAMPTZ`
- `CONSTRAINT uq_resp UNIQUE (participant_id, session_number, task_code)`

**telemetry_logs** — `id BIGSERIAL PK`, `participant_id FK NOT NULL`, `session_number SMALLINT NOT NULL`, `task_code VARCHAR(10) NULL`, `event_type` enum (`PASTE`,`PASTE_BLOCKED`,`TAB_BLUR`,`TAB_FOCUS`,`ANSWER_REVISION`,`HINT_UNLOCK`,`HINT_COPY`,`INFRACTION`,`BREAK_START`,`BREAK_END`,`SESSION_START`,`SESSION_END`), `event_metadata JSONB NOT NULL DEFAULT '{}'`, `client_timestamp_ms BIGINT NOT NULL`, `created_at TIMESTAMPTZ`. Index on (participant_id, session_number, event_type).
  - PASTE metadata: `{character_count, time_since_last_keystroke_ms, field_id}`
  - TAB_BLUR/TAB_FOCUS metadata: `{away_duration_ms}` (on focus)
  - ANSWER_REVISION metadata: `{field_id, previous_value, new_value, t_offset_ms}`
  - HINT_UNLOCK metadata: `{level, request_number, t_offset_ms}`
  - INFRACTION metadata: `{kind: "attempted_paste" | "tab_switch_s2", detail}`

**hint_events** — first-class table mirroring HINT_UNLOCK for easy joins: `id UUID PK`, `participant_id FK`, `task_code`, `level SMALLINT`, `request_number SMALLINT`, `viewed_duration_ms INT NULL`, `copied BOOLEAN DEFAULT false`, `created_at`. (Write to BOTH telemetry_logs and hint_events on unlock.)

**scale_responses** — tidy long format: `id UUID PK`, `participant_id FK`, `session_number SMALLINT`, `item_code VARCHAR(10) NOT NULL` (S1-E1..S1-E3, S1-H1..H3, S1-T1..T3, S2-E1..E3, S2-H1..H3, S2-I1..I3), `rating SMALLINT NOT NULL CHECK 1..5`, UNIQUE (participant_id, item_code).

**session_meta** — per participant per session: `id UUID PK`, `participant_id FK`, `session_number SMALLINT`, `started_at TIMESTAMPTZ`, `ended_at TIMESTAMPTZ`, `transfer_prompt_used BOOLEAN NULL` (Session 2 only), `transfer_prompt_text TEXT NULL`, UNIQUE (participant_id, session_number).

**rater_scores** — `id UUID PK`, `task_response_id FK→task_responses NOT NULL`, `rater_id FK→staff_users NOT NULL`, `correctness SMALLINT CHECK 0..2`, `justification_quality SMALLINT CHECK 0..2`, `independence SMALLINT CHECK 0..2`, `is_double_score BOOLEAN DEFAULT false`, `scored_at TIMESTAMPTZ`, UNIQUE (task_response_id, rater_id).

**deviation_logs** — `id UUID PK`, `batch_id FK`, `participant_id FK NULL`, `proctor_id FK`, `description TEXT NOT NULL`, `created_at`.

**layer2_logs** — proctor-entered after sessions, for Layer 2 calibration clinics only: `id UUID PK`, `participant_id FK UNIQUE`, `prompt_log_id VARCHAR(40) NOT NULL`, `model_name_shown VARCHAR(60) NOT NULL`, `prompt_count SMALLINT NOT NULL`, `time_in_tool_minutes NUMERIC NOT NULL`, `copy_similarity_note TEXT NULL`, `entered_by FK→staff_users`.

### B2. API surface (prefix `/api/v1`)

**Health & meta:** `GET /health` → `{status, db, version}`.

**Auth (staff):** `POST /auth/login` → JWT (role claim). All proctor/rater/admin routes require JWT with the right role via a `require_role` dependency. Participants never authenticate — their flow is keyed by `participant_code` plus the server-tracked state machine.

**Proctor — clinic setup:** CRUD for sites and batches; `POST /participants/check-in` body `{batch_id, consent_given:true, device hints}` → creates participant with generated `participant_code`, status CHECKED_IN; returns the code for the proctor to hand to the participant. `POST /participants/{id}/assignment` body `{group, method}` — server computes a SUGGESTION first (see B3) and the proctor accepts or overrides. `PATCH /participants/{id}/warmup-override` body `{score}`. `POST /deviations`. `POST /layer2-logs`. `GET /batches/{id}/monitor` → live roster: code, status, current_step, last sync age, infraction count.

**Participant flow (no auth, code-keyed):**
- `POST /session/resume` body `{participant_code}` → full rehydration payload: status, current_step, draft_responses, unsynced telemetry echo, break_ends_at, the instrument content for the current step. THIS is the crash-recovery entry point.
- `PATCH /session/state` — the 30-second background sync: `{participant_code, current_step, draft_responses, telemetry_batch[]}`. Appends telemetry_batch rows to telemetry_logs idempotently (client supplies a per-event `client_event_id` UUID; deduplicate on it) and overwrites the draft snapshot.
- `POST /form0/submit` — validates all Form 0 fields, auto-scores warm-up (B0-1 `4800` with thousands-separator tolerance, B0-2 `15`, B0-3 `YES`, B0-4 `09:55` accepting `9:55`), stores answers + auto score, sets status FORM0-complete, returns the assignment suggestion to the proctor channel (participant UI shows "Please wait for your proctor to confirm your group").
- `POST /tasks/{task_code}/submit` — full episode payload (all task_responses columns + final telemetry flush). Server re-validates: justification ≥ 30 non-whitespace chars; verification_evidence required if verified; AI columns must be NULL unless participant is AI_ASSISTED and session is 1; auto-scores objective_auto_correct against the answer key; enforces task ordering (cannot submit A2 before A1); enforces session rules (403 if hint columns appear in Session 2). On success advances `current_step`.
- `POST /hints/request` body `{participant_code, task_code, level}` — HARD GUARDS: participant must be AI_ASSISTED, session must be 1, level must be exactly current_unlocked_level + 1 (sequential unlocking, no skipping). Returns hint_text, records hint_events + telemetry. 403 otherwise.
- `POST /break/start` → server sets `break_ends_at = now() + BREAK_DURATION_SECONDS`, returns it. `GET /break/status` → remaining seconds (server-computed). `POST /break/complete` → only succeeds if `now() >= break_ends_at` (tolerance 2s); transitions to SESSION2.
- `POST /scales/submit` body `{session_number, items: [{item_code, rating}]}` — validates the exact expected item set for the participant (trust items S1-T1..T3 only when AI_ASSISTED).
- `POST /session2/transfer-prompt` body `{used, text?}`.

**Rater (blinded):** `GET /rater/queue` → list of unscored task_responses assigned to this rater, each exposing ONLY: an opaque response id, session_number, task_code, objective_question, objective_answer, text_justification. NEVER expose: participant_code, group_assignment, assistance/hint fields, telemetry, confidence, timers. `POST /rater/scores`. Double-scoring: when a response is created, with probability targeting ≥20% mark it `needs_double_score`; the queue assigner gives those to two distinct raters and sets `is_double_score` on the second score.

**Exports (ADMIN/PROCTOR):** `GET /exports/{name}.csv` streaming CSV for: `participants`, `task_responses`, `telemetry_events`, `hint_events`, `scale_responses`, `rater_scores`, `session_meta`, `deviation_logs`, `layer2_logs`; plus `GET /exports/data_dictionary.csv` generated from the live schema (table, column, type, allowed values, description — write descriptions in a static registry module aligned to the study ODS). Participant export uses `participant_code` as the key and EXCLUDES `user_agent_raw`. All CSVs must load cleanly into Pandas with `pd.read_csv` and merge on `participant_code` (+ `session_number`, `task_code` where applicable) — include those denormalized key columns in every export.

### B3. Stratified assignment suggestion algorithm

Maintain counts per stratum (education_level × ai_use_frequency bucketed as LOW = NEVER/MONTHLY, HIGH = WEEKLY/DAILY) within the batch's site. Suggest the group (CONTROL vs AI_ASSISTED) that has fewer participants in that stratum; tie → fewer overall; still tie → random. Return `{suggested_group, stratum, current_counts}` so the proctor sees why. Record `assignment_method`.

### B4. Validation, errors, security

- Custom exception hierarchy → consistent `{"error": {"code", "message", "details"}}` envelope; Pydantic 422s pass through with field details.
- Rate-limit `POST /auth/login` (simple in-memory limiter is fine for LAN).
- bcrypt for password hashing; JWT HS256 with `JWT_SECRET`; role enforcement in dependencies, re-checked in services.
- A startup bootstrap creates the ADMIN account from `ADMIN_BOOTSTRAP_*` env vars if no staff exist, and logs the credentials reminder to console once.
- Server-side enforcement is the source of truth for EVERY rule the frontend enforces (30-char minimum, sequential hints, break duration, task order, Session-2 lockout). The frontend is UX; the backend is law.

---

## MODULE C — FRONTEND ENGINEER + UI DESIGN EXPERT (React + Tailwind)

You are building a premium, low-fatigue, enterprise-grade research instrument UI. It must feel like a top-tier product (Stripe-onboarding calm, Retool density discipline), not a Google Form. Apply the Smart Interface Design Patterns ethos and the project's form defaults throughout.

### C1. Design system (define ONCE in `tailwind.config.js` + a tokens CSS file; never use raw hex in components)

Colors (CSS variables wired into Tailwind theme):
```
--background:     #112330   (page background)
--surface-card:   #1A303F   (cards, panels)
--surface-hover:  #243D4F   (hover/active surfaces)
--text-primary:   #FCFDFD
--text-secondary: #B3C0CB
--text-disabled:  #6E8291
--border-subtle:  #2A4356
--accent:         #38BDF8   (primary actions, focus rings, progress)
--accent-hover:   #0EA5E9
--success:        #34D399
--warning:        #FBBF24
--error:          #F87171
```
Typography: Inter (self-hosted @fontsource/inter), weights 400/500/600/700. Base size 16px MINIMUM on all inputs (prevents iOS zoom). Type scale via Tailwind defaults; headings tracking-tight; line-height 1.5–1.7 body.
Spacing: 4px grid only. Radii: 8px inputs, 12px cards, 16px modals. Shadows: subtle, reduced for dark mode. Focus: every interactive element has a visible `focus-visible` ring in --accent at 40% opacity, 2px offset. Transitions: 200ms cubic-bezier(0.4,0,0.2,1); entrances 400ms; never linear easing. Respect `prefers-reduced-motion`.

### C2. Form interaction rules (NON-NEGOTIABLE — from the project's form-pattern notes)

1. Labels: short, sentence case, no trailing colons, ALWAYS visible, top-aligned above the input. Clicking a label focuses its input. Labels are never placeholders; **no placeholders at all**; no floating labels; no icons inside text boxes.
2. Order within a field block: Label → hint (optional, --text-secondary) → input → error. Lengthy hints go in a conditional reveal ("More about this" disclosure), never tooltips.
3. Inputs are required by default; mark only optional ones with "(optional)". Single-column vertical flow exclusively — never two side-by-side fields.
4. Input width reflects expected content (2ch/5ch/10ch/15ch/20ch fixed, or 25/33/50/75/100% fluid). Numeric answers ≈ 10–15ch; justifications full width.
5. Validation triggers on blur and on Save & Next — NEVER while typing (except the live character counter, which is informational). No auto-masking, no auto-focus jumps, no auto-correct/auto-capitalize/spellcheck on answer fields (`autocomplete="off"`, `spellcheck="false"`); default text virtual keyboard except `inputmode="numeric"` for pure numeric answers.
6. Errors: descriptive sentence below the field in --error, with a gentle 150ms fade-in; the input border becomes --error. Example copy: "Please provide a brief explanation of your reasoning (minimum 30 characters) to continue."
7. Justification textareas: live counter bottom-right, `--text-disabled` while < 30 chars (after trim), transitioning smoothly to `--text-primary` at threshold; counter format `27 / 30 minimum`.
8. Primary button (Save & Next): --accent background, #08222F text or white per contrast check (must pass WCAG AA), hover --accent-hover + slight elevation; disabled state at 40% opacity with `cursor-not-allowed`; loading state with inline spinner and label "Saving…". Disabled until the page's validation passes. One primary button per screen, bottom-right of the form column, with a quiet "Back is not available — answers are final" caption where applicable (forward-only protocol).
9. Touch targets ≥ 44×44px. Flawless keyboard navigation: logical tab order, Enter submits when valid, radio groups arrow-navigable. WCAG 2.1 AA contrast everywhere (verify: --text-secondary on --surface-card passes AA for normal text).

### C3. Layout architecture

**Split-Screen Workspace (tablet/desktop ≥ 1024px):** fixed left panel 40% — persistent context: study step title, the CURRENT task's objective question in a calm, readable card, the rules reminder for the current session, and (AI group, Session 1 only) the Assistance panel. Right panel 60%, scrollable — the form fields for the current episode. Subtle `--border-subtle` divider. On < 1024px, panels stack: context card collapses to a sticky summary bar with a disclosure to re-read the full question; assistance panel becomes a bottom sheet.

**Progress stepper:** sticky at the top of the right panel: `Session 1 · Task 3 of 6 — B1 Logic validity` plus a thin determinate progress bar (--accent). Steps are NOT clickable (forward-only). Include a footer sync indicator: tiny cloud icon + "Draft saved automatically" in --text-secondary that pulses gently on each successful background sync, and switches to "Working offline — will retry" (--warning) when a sync fails.

### C4. State, persistence, and resilience engine (custom hooks; Zustand store + TanStack Query)

- `useSessionStore` (Zustand): participant_code, status, current_step, draft answers, telemetry buffer, hint state, timer marks. Persist a mirror to localStorage keyed `aivb:{participant_code}` debounced 500ms on every change.
- Background sync: every 30s AND on every field blur (debounced), PATCH `/session/state` with the draft + telemetry buffer (each event carries a client-generated `client_event_id` UUID). On 2xx, clear the sent telemetry from the buffer. On failure, keep buffering and show the offline indicator; retry with backoff. Never block the UI on sync.
- Rehydration: the app's participant entry screen asks ONLY for the participant code (one 15ch input). On submit, call `/session/resume`; restore the store, re-inject draft values into the current step's fields, scroll to the first unanswered field, and resume timers correctly (timers restart for the current phase; do not fabricate elapsed time).
- Strict React 18 correctness: effects resilient to StrictMode double-invoke; exhaustive deps; no fetch-in-useEffect for server data (TanStack Query mutations/queries); TypeScript strict mode, zero `any`.

### C5. Telemetry capture engine (a single `useTelemetry(taskCode)` hook)

- `visibilitychange` + window `blur`/`focus`: emit TAB_BLUR on hide, TAB_FOCUS with `{away_duration_ms}` on return.
- `paste` listener on all task inputs: Session 1 → allow, emit PASTE `{character_count, time_since_last_keystroke_ms, field_id}`. Session 2 → `e.preventDefault()`, emit PASTE_BLOCKED + INFRACTION `{kind:"attempted_paste"}`, show inline message "Manual typing is required in this session."
- Answer revisions: on every change to the objective answer control, emit ANSWER_REVISION `{field_id, previous_value, new_value, t_offset_ms}` and increment the local `answer_change_count`.
- Split timers via `performance.now()`: `t_start` on task mount; `t_select` on FIRST committed objective answer (subsequent revisions do not move `t_select`); `t_end` on Save & Next click. Compute the three integer ms durations and include them in the submit payload.
- Session 2 tab discipline: on TAB_FOCUS after a blur, show a calm full-screen modal: "Tab switch detected. Please stay on this page during Session 2. This event has been recorded." Single "Continue" button; log INFRACTION `{kind:"tab_switch_s2"}`. Session 1: log silently, no modal.

### C6. The Assistance panel (Hint Bank UI — AI group, Session 1 ONLY)

This digitizes the Offline Hint Bank EXACTLY as the protocol defines: a structured assistance ladder, levels 0–3, sequential. It must read as calm structured help, not a chatbot, and not a textbook accordion. Design:
- A distinct card in the left panel titled **Assistance** with the standing microcopy: "You may request structured assistance. Use the lowest level you need. You must write your final answer and justification in your own words."
- Three stacked unlock rows: `Level 1 — Hint`, `Level 2 — Scaffold`, `Level 3 — Worked steps`. Only the next sequential level is enabled; later levels show a lock glyph and --text-disabled. Clicking an enabled level shows a 600ms skeleton shimmer, then reveals the hint text in a quiet inset panel (--surface-hover background, --border-subtle). Each unlock emits HINT_UNLOCK + hint_events row; `requests_count` increments on every unlock click; `assistance_level` = highest level revealed for this task.
- Each revealed hint has a small "Copy" affordance; using it emits HINT_COPY and sets a per-task `copied` flag (feeds Copy used).
- Track per-hint visible time (IntersectionObserver or reveal→submit delta) and send as `viewed_duration_ms`.
- The panel is rendered ONLY when `group === AI_ASSISTED && session === 1`. Control group and all of Session 2 never mount the component. Do not ship its code path behind a mere CSS hide.

### C7. Screen-by-screen flow (participant)

1. **Welcome / code entry** — app title, one input "Participant ID", Continue. If the code has an active state → resume seamlessly to the exact step.
2. **Consent (digital)** — render the consent summary content (Module D8) in readable sections; a single required checkbox: "I have read and understood the above and I agree to take part." Consent is captured at proctor check-in flow OR here per deployment; implement it here as the first participant screen gating everything (records consent_timestamp). A "I do not consent" secondary action routes to a neutral thank-you screen and marks WITHDRAWN.
3. **Form 0** — the five context fields (radio groups / segmented controls per Module D1) then the four warm-up items presented one screen, clearly numbered, with a banner: "Answer these on your own. No AI, no internet search, no help." Save & Continue → auto-score → status screen: "Thank you. Please wait — your proctor will confirm your group." Poll `/session/resume` every 5s until assignment exists, then auto-advance.
4. **Session 1 intro** — group-specific rules card (verbatim rules from Module D4/D5), Start Session 1 button (emits SESSION_START).
5. **Session 1 tasks ×6** (A1→A2→B1→B2→C1→C2), each one screen: left panel question + (AI group) Assistance panel; right panel: objective answer field → justification textarea → (AI group) Copy used? Yes/No + Verified? Yes/No → conditional reveal when Verified=Yes: verification method radio (Recompute / Estimate / Alt method / Consistency / Other + text when Other) and one-sentence evidence input (required) → (control group) compliance checkbox "I did not use AI, internet search, or help from others for this task." → checks row: Task familiarity Yes/No, Self-check Yes/No, Confidence 1–5 (radio pills) → optional Notes (the only optional field) → Save & Next.
6. **Session 1 post-block scales** — Likert grid items (Module D6), one rating row per item, radio pills 1–5 labeled "Strongly disagree … Strongly agree"; trust items shown ONLY to AI group.
7. **Break** — full-screen centered SVG radial countdown, 220px ring, --accent stroke depleting via stroke-dashoffset in sync with the server-anchored `break_ends_at`; MM:SS readout (tabular-nums) center; microcopy: "Session 1 complete. Please take a short rest. Session 2 will begin automatically." On refresh, recompute remaining from the server. At 0: soft chime (small bundled audio, respect reduced-motion/muted failure silently), auto-advance.
8. **Session 2 intro** — rules card: "AI is removed for everyone in Session 2. No AI, no internet search, no help. Solve independently." Enforcement mode arms here (paste blocking + tab modal).
9. **Session 2 tasks ×4** (A3→A4→B3→B4) — same episode layout, NO assistance panel, NO AI columns; checks row identical.
10. **Transfer prompt** (once, after B4): "Did you use a method you learned or saw in Session 1?" Yes/No; if Yes, one-line text (required when Yes).
11. **Session 2 post-block scales** (effort, engagement, independence items).
12. **Debrief / completion** — thank-you screen with the participant's code displayed for the proctor's checklist, status COMPLETED. No further navigation.

### C8. Proctor dashboard (JWT)

Left nav: Batches, Check-in, Monitor, Deviations, Layer 2 entry, Exports, (Admin: Staff & Sites). Key screens:
- **Check-in:** select batch → consent confirmation → Generate ID (big result card showing the new code, monospace 24px, with a copy affordance) → Form 0 happens on the participant's device → assignment card appears when Form 0 completes: shows suggested group + stratum counts table; buttons "Accept suggestion" / "Override to CONTROL" / "Override to AI-ASSISTED" (override requires a one-line reason stored in deviation_logs).
- **Monitor:** live table (5s polling) — code, status chip, current step, last sync age, infractions count (S2), warm-up score (with inline override control). Row hover --surface-hover; sticky header; column widths explicit; truncation with title attr.
- **Layer 2 entry:** per participant form for prompt_log_id, model name shown, prompt count, time in tool, similarity note.
- **Exports:** one card per CSV with row counts and a Download button; plus "Download all (zip)" optional.

### C9. Rater panel (JWT, blinded)

Distraction-free scoring view: the queue list left; the selected response center showing ONLY task question, objective answer, justification text; three 0–2 segmented scoring controls (Correctness, Justification quality, Independence) with the rubric anchor text under each; Submit & Next. A progress line "14 of 62 scored". Absolutely no group/hint/telemetry data anywhere in this bundle's network responses or UI.

---

## MODULE D — SEED CONTENT (VERBATIM — load via idempotent seeder; do not edit wording)

### D1. Form 0 fields and options
- Age band: `18–24` | `25–34` | `35–44` | `45+`
- Education level: `Secondary` | `Diploma` | `Degree` | `Postgrad`
- English comfort (1–5)
- AI use frequency: `Never` | `Monthly` | `Weekly` | `Daily`
- AI confidence (1–5)

### D2. Baseline warm-up (no AI; auto-score 1 point each)
- B0-1: "Eggs cost 800 UGX each. Buy 6 eggs. Total cost?" — key: 4800 (accept `4800`, `4,800`, `4800 UGX`)
- B0-2: "Battery moves from 60% to 75%. Percent point change?" — key: 15 (accept `15`, `15%`, `15 percentage points`)
- B0-3: "If A then B. A is true. Can we conclude B? Yes/No" — key: Yes
- B0-4: "Meeting starts 09:20 and lasts 35 minutes. End time?" — key: 09:55 (accept `9:55`, `09:55`, `0955`)

### D3. Tasks (answer keys fixed in advance)

```json
[
 {"task_code":"A1","session":1,"order":1,"family":"Data arithmetic","answer_type":"NUMERIC","correct_answer":"17000",
  "objective_question":"Prices: Bread 2,000 UGX, Milk 3,500 UGX, Sugar 4,000 UGX. A customer buys 3 bread, 2 milk, 1 sugar. What is the total cost?",
  "justification_prompt":"Explain how you computed the total and how you checked the arithmetic."},
 {"task_code":"A2","session":1,"order":2,"family":"Percent change","answer_type":"NUMERIC","correct_answer":"83.3","answer_tolerance":0.4,
  "objective_question":"Weekly malaria cases: W1=30, W2=45, W3=40, W4=55. Percent increase from W1 to W4?",
  "justification_prompt":"Show the formula and steps. Include a quick check."},
 {"task_code":"B1","session":1,"order":3,"family":"Logic validity","answer_type":"YES_NO","correct_answer":"YES",
  "objective_question":"If it rains, the road floods. The road did not flood. Therefore it did not rain. Is this valid? Yes or No.",
  "justification_prompt":"Explain in 1 to 3 sentences using the rule given."},
 {"task_code":"B2","session":1,"order":4,"family":"Time consistency","answer_type":"YES_NO","correct_answer":"NO",
  "objective_question":"A timetable says a bus leaves at 08:00 and takes 1 hour 30 minutes. It arrived at 10:00. Is the timetable consistent? Yes or No.",
  "justification_prompt":"Explain your time calculation and what would be consistent."},
 {"task_code":"C1","session":1,"order":5,"family":"Simple interest","answer_type":"NUMERIC","correct_answer":"50000",
  "objective_question":"Loan 1,000,000 UGX at 10% simple interest for 6 months. Interest amount?",
  "justification_prompt":"Write the formula and show one line of calculation."},
 {"task_code":"C2","session":1,"order":6,"family":"Cost comparison","answer_type":"TEXT","correct_answer":"Weekly cheaper by 5,000 UGX (45,000 vs 50,000)",
  "objective_question":"Plan is 5,000 UGX per day or 30,000 UGX per week. For 10 days, which is cheaper and by how much?",
  "justification_prompt":"Explain the comparison."},
 {"task_code":"A3","session":2,"order":1,"family":"Data arithmetic (parallel)","parallel_to":"A1","answer_type":"NUMERIC","correct_answer":"19500",
  "objective_question":"Prices: Rice 4,500 UGX, Beans 3,000 UGX, Soap 2,500 UGX. Buy 2 rice, 1 beans, 3 soap. What is the total cost?",
  "justification_prompt":"Show how you checked the calculation."},
 {"task_code":"A4","session":2,"order":2,"family":"Average (parallel)","parallel_to":"A2","answer_type":"NUMERIC","correct_answer":"142.5","answer_tolerance":0.5,
  "objective_question":"Water use in litres: Day 1 = 120, Day 2 = 150, Day 3 = 135, Day 4 = 165. What is the average daily use?",
  "justification_prompt":"Explain the steps for an average."},
 {"task_code":"B3","session":2,"order":3,"family":"Logic (parallel)","parallel_to":"B1","answer_type":"YES_NO","correct_answer":"YES",
  "objective_question":"If a person is a student, then they have a registration number. John has no registration number. Can we conclude John is not a student? Yes or No.",
  "justification_prompt":"Explain your reasoning."},
 {"task_code":"B4","session":2,"order":4,"family":"Time (parallel)","parallel_to":"B2","answer_type":"YES_NO","correct_answer":"NO",
  "objective_question":"A meeting starts at 14:10 and lasts 50 minutes. The minutes say it ended at 15:20. Is that correct? Yes or No.",
  "justification_prompt":"Explain the time calculation."}
]
```
C2 objective answer UI: because the key is comparative, render TWO controls — a segmented choice `Daily plan | Weekly plan` (key: Weekly) and a numeric "By how much (UGX)?" (key: 5000). Auto-correct = both right. Store combined as `"WEEKLY|5000"` in objective_answer.

### D4. Offline Hint Bank (Session 1 tasks only, levels 1–3, verbatim)

```json
{
 "A1": {"1":"Multiply price×quantity then add.",
        "2":"3×2000=____; 2×3500=____; 1×4000=____; add.",
        "3":"3×2000=6000; 2×3500=7000; 1×4000=4000; total 17000; verify by re-add/estimate."},
 "A2": {"1":"(new−old)/old×100.",
        "2":"55−30=____; ____/30=____; ×100.",
        "3":"25/30≈0.833; 83.3%; verify 30×0.83≈25."},
 "B1": {"1":"Check logical form A→B, ¬B, therefore ¬A.",
        "2":"Let A=rains B=floods; is it valid?",
        "3":"Valid (modus tollens) under rule; justify assumption."},
 "B2": {"1":"Add travel time to departure.",
        "2":"08:00 + 1h = 09:00; +30m = 09:30.",
        "3":"Expected 09:30, not 10:00; verify via minutes."},
 "C1": {"1":"Simple interest P×R×T, convert months.",
        "2":"T=6 months=0.5 years; interest = 1,000,000×0.10×0.5=____.",
        "3":"Interest=50,000; verify 10%/yr=100,000 then half year."},
 "C2": {"1":"Compute daily total and weekly+extra days.",
        "2":"Daily 10×5000=____; Weekly 30000 + 3×5000=____.",
        "3":"50,000 vs 45,000; weekly cheaper by 5,000; verify subtract."}
}
```

### D5. Session rules text (render verbatim on intro screens)

Control, Session 1: "No AI, no internet search, no notes, no help from other people. Work quietly and do not discuss answers. Write clearly. Show brief working for numeric tasks. Answer the checks after each task."
AI-assisted, Session 1: "You may request structured assistance only through the approved channel. Use the lowest help level needed (0–3). You must write your final answer and justification in your own words. If you use wording from assistance, tick Copy used = Yes. If you verify, tick Verified = Yes and write one sentence of evidence. Assistance ladder: 0 none, 1 hint, 2 scaffold, 3 near-complete worked steps."
Session 2 (everyone): "AI is removed for everyone in Session 2. No AI, no internet search, no help. Solve independently. Show brief working and write justifications in your own words. Answer checks after each task."
Transfer prompt (Session 2, once): "Did you use a method you learned or saw in Session 1? If Yes, write one line."

### D6. Post-block scale items (Likert 1 = strongly disagree … 5 = strongly agree)

Session 1 — Effort: S1-E1 "This task set required a lot of mental effort." S1-E2 "I had to concentrate hard during the tasks." S1-E3 "I felt mentally tired after completing the tasks."
Session 1 — Engagement: S1-H1 "I stayed actively involved while solving the tasks." S1-H2 "I tried to understand each step, not only the final answer." S1-H3 "I checked my reasoning before submitting answers."
Session 1 — Trust and calibration (AI-assisted only): S1-T1 "I accepted assistance quickly because it looked confident or authoritative." S1-T2 "I would have preferred to verify more, but time or effort made me skip verification." S1-T3 "I feel I could solve similar tasks later without AI help."
Session 2 — Effort: S2-E1/E2/E3 (same statements as S1 effort). Engagement: S2-H1/H2/H3 (same as S1 engagement).
Session 2 — Independence self-check: S2-I1 "I felt the tasks were harder without AI than I expected." S2-I2 "I could explain my reasoning clearly without AI help." S2-I3 "I verified my answers more carefully in Session 2."

### D7. Rubric anchors (rater panel, 0–2 each)
Correctness: 0 incorrect · 1 partially correct · 2 fully correct. Justification quality: 0 absent/irrelevant · 1 partial reasoning · 2 clear, complete reasoning. Independence: 0 appears dependent/copied · 1 mixed · 2 clearly independent reasoning in own words.

### D8. Consent screen content (summarize faithfully; keep these elements)
Purpose: a research study on how people solve problems with and without AI assistance. Participation is voluntary; you may withdraw at any time without consequence. Duration: one sitting of about 90 minutes with a short break. No names, phone numbers, or personal identifiers are recorded; data is stored under an anonymous Participant ID only. Participation is not linked to grades, employment, or services. Checkbox: "I have read and understood the above and I agree to take part."

---

## MODULE E — TESTING & DEBUGGING PROTOCOL (you must actually run these)

1. **Backend tests (pytest + httpx AsyncClient, test DB):** auth + role guards; check-in generates race-safe sequential codes (spawn 20 concurrent check-ins, assert no duplicates); Form 0 auto-scoring table-driven over the D2 acceptance variants; task submit validation matrix (short justification 422; verified-without-evidence 422; AI columns from control 403/422; out-of-order task 409; duplicate submit 409 via unique constraint); hint guards (control 403, session 2 403, level-skipping 403, sequential ok); break endpoint (complete before time 403, after time ok); telemetry idempotency (resend same client_event_id batch → no duplicate rows); rater blinding (assert forbidden fields absent from queue payload, character-level check on the JSON); exports (every CSV parses with pandas in a test, keys present, user_agent_raw absent).
2. **Frontend:** `tsc --noEmit` clean; `vite build` clean; component tests (Vitest + Testing Library) for: justification counter gating the button; hint ladder sequential enabling; Session 2 paste blocking; split-timer computation (mock performance.now); resume rehydration placing user on saved step.
3. **End-to-end smoke (scripted, run inside compose):** a script `scripts/e2e_smoke.py` that drives the API through a full participant lifecycle (check-in → consent → Form 0 → assignment → six S1 submits with hints → scales → break (override BREAK_DURATION_SECONDS=3 via env for the test) → four S2 submits → transfer → scales → completed), then asserts: 10 task_responses, 22+ telemetry rows, hint_events present, exports row counts correct. This script doubles as the demo.
4. **Debugging discipline:** when anything fails, read the actual error, reproduce minimally, fix root cause (never silence with try/except-pass), re-run the failing test, then re-run the full suite. Log meaningful context (participant_code, step) in backend exceptions. Frontend: an ErrorBoundary per route that shows a calm recovery screen with "Re-enter your Participant ID to continue — your progress is saved."

---

## MODULE F — IMPLEMENTATION PHASES (work in this order; each gate must pass before the next phase)

- **Phase 0 — Scaffold.** Monorepo, Docker Compose, env, nginx, health endpoint, DB up, Alembic baseline. GATE: `docker compose up --build` → `GET /api/v1/health` returns ok from the nginx proxy.
- **Phase 1 — Schema + seed.** All tables, enums, constraints; idempotent seeder for D1–D7; bootstrap admin. GATE: seeder runs twice without duplicates; psql spot-checks pass.
- **Phase 2 — Auth + proctor core.** Login, roles, sites/batches CRUD, check-in with race-safe codes, assignment suggestion + override, warm-up override, deviations. GATE: pytest module green.
- **Phase 3 — Participant flow backend.** resume, state sync (idempotent telemetry), form0 submit + auto-score, task submit with full validation + ordering + auto-correct, hints with guards, break anchoring, scales, transfer. GATE: pytest matrix green.
- **Phase 4 — Frontend foundation.** Design tokens, Tailwind config, Inter, layout shell, code entry + resume, consent, Form 0. GATE: build clean; manual flow to "wait for proctor".
- **Phase 5 — Episode engine.** Task screen, validation UX, split timers, telemetry hook, revision tracking, sync indicator, localStorage mirror. GATE: component tests green; kill the tab mid-task and resume to the same field with draft intact.
- **Phase 6 — Assistance panel + break + Session 2 enforcement.** Hint ladder UI/logging, radial break timer (server-anchored, refresh-proof), paste blocking + tab modal in S2, transfer prompt, scales screens. GATE: hints impossible in S2 (route + API); refresh during break resumes at correct remaining time.
- **Phase 7 — Proctor dashboard + rater panel.** Monitor polling, Layer 2 entry, blinded rater queue + scoring + 20% double-scoring. GATE: blinding test green.
- **Phase 8 — Exports + e2e + polish.** CSV suite + data dictionary, e2e smoke script, accessibility pass (focus rings, contrast, keyboard), responsive pass at 360/768/1024/1440, README with LAN deployment steps. GATE: e2e green from clean `docker compose up --build`; all pandas export checks green.

## ACCEPTANCE CHECKLIST (final self-audit — verify every line, fix anything failing)
☐ Clean clone → `docker compose up -d --build` → working app on LAN IP, no internet used at runtime
☐ Inter renders offline; zero CDN requests in the network tab
☐ Full participant lifecycle completes on desktop AND a 360px mobile viewport
☐ Power-cut simulation (kill tab anytime) loses nothing committed and resumes exactly
☐ Hint ladder: sequential only; logged levels/requests/copy/viewed-time all in DB
☐ Session 2: no assistance UI, paste blocked, infractions logged, hint API 403
☐ Break cannot be skipped by refresh; duration follows env config
☐ Rater payloads contain zero group/assistance/telemetry fields (verified by test)
☐ All 10 CSVs + data dictionary download, parse in pandas, and merge on participant_code
☐ No TODOs, no placeholders, no console errors, `tsc` and all tests green
