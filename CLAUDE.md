# CLAUDE.md — Agent Operating Rules: "AI vs the Brain" Data Collection Platform

## What this project is
A research-grade, offline-first data collection platform digitizing a fixed experimental
protocol (Forms 0/1A/1B/3, post-block scales, Offline Hint Bank levels 0–3, blinded rubric
scoring, proctor deviation log) with behavioral telemetry for COI/HES analysis.
The single source of truth for WHAT to build is `MEGA_PROMPT.md`. Read it fully before coding.
Follow its Module F phases in order; never skip a Verification Gate.

## Instruction hierarchy
1. MEGA_PROMPT.md (spec) → 2. this file (conduct) → 3. your judgment.
If the spec is ambiguous: pick the simplest interpretation consistent with the study protocol,
record it in `DECISIONS.md`, and continue. Never invent features beyond the spec.

## Pinned stack — do not substitute or upgrade
- Frontend: React 18.3.x, TypeScript 5.5.x (strict), Vite 5.x, Tailwind 3.4.x,
  Zustand 4.x, TanStack Query 5.x, React Router 6.x, @fontsource/inter.
- Backend: Python 3.12, FastAPI 0.115.x, Pydantic v2, SQLAlchemy 2.0 async + asyncpg,
  Alembic, Uvicorn, python-jose, passlib[bcrypt].
- Infra: PostgreSQL 16, nginx stable-alpine, Docker Compose v2, node:20-alpine build stage.
- Pin exact versions in package-lock.json / requirements. Verify installs resolve before coding on them.

## Non-negotiable invariants (re-check after every phase)
- OFFLINE: no CDN links, no external calls, fonts self-hosted. The app must run on a LAN island.
- ANONYMITY: never store names/phones/emails/IPs/geolocation. participant_code is the only key.
  user_agent_raw stays out of every export.
- VERBATIM INSTRUMENTS: task texts, hint texts, scale items, rules, and option labels come from
  MEGA_PROMPT.md Module D character-for-character. Never reword research content.
- TIDY DATA: analysis variables are atomic typed columns. JSONB only for telemetry metadata
  and draft snapshots.
- SERVER IS LAW: every frontend rule (30-char minimum, sequential hints, task order, break
  duration, Session-2 lockout) is re-enforced server-side. Hint endpoints return 403 for
  control group, for Session 2, and for level-skipping — always.
- RESILIENCE: localStorage mirror (500ms debounce) + 30s background sync with idempotent
  telemetry (client_event_id dedupe). Killing the tab at any moment must lose nothing committed.
- BLINDING: rater-facing endpoints/UI must never expose group, assistance, telemetry,
  confidence, timers, or participant_code. A test asserts this.

## Design system conduct
- Tokens only — never raw hex in components: bg #112330, card #1A303F, hover #243D4F,
  text #FCFDFD / #B3C0CB / #6E8291, border #2A4356, accent #38BDF8 (hover #0EA5E9),
  success #34D399, warning #FBBF24, error #F87171. Inter 400/500/600/700.
- Forms: visible top-aligned sentence-case labels (no colons), label→hint→input→error order,
  no placeholders, no input icons, single-column only, ≥16px input font, validate on blur /
  submit never while typing, one primary button per screen, 44px touch targets,
  WCAG 2.1 AA contrast, focus-visible rings everywhere, 200ms eased transitions,
  respect prefers-reduced-motion.

## Engineering conduct
- TypeScript strict; zero `any`; exhaustive useEffect deps; no fetch-in-useEffect (use
  TanStack Query); StrictMode-safe effects; immutability always.
- FastAPI: async everywhere; Pydantic request AND response models on every route; dependency
  injection for db/auth/services; custom exception envelope {"error":{code,message,details}};
  repository pattern; Alembic for every schema change (never edit applied migrations).
- Git hygiene: commit at the end of each phase with message `phase N: <summary>`.
- No TODO/FIXME/placeholder/mock left in delivered code. No commented-out blocks.

## Testing & debugging discipline
- Write and RUN tests per Module E at each phase gate: pytest (validation matrix, hint guards,
  race-safe ID generation, telemetry idempotency, blinding, pandas-parses-every-CSV),
  Vitest (counter gating, hint ladder, paste blocking, split timers, rehydration),
  and the scripted end-to-end smoke (`scripts/e2e_smoke.py`) against the compose stack.
- On any failure: read the real error, reproduce minimally, fix the root cause, re-run the
  failing test, then the whole suite. Never suppress with bare try/except or test skips.
- Before declaring done, run the full ACCEPTANCE CHECKLIST in MEGA_PROMPT.md and fix every
  unchecked line.

## Definition of done
`docker compose up -d --build` from a clean clone yields: seeded instruments, bootstrap admin,
a complete participant lifecycle working on desktop and 360px mobile over LAN with no internet,
proctor dashboard, blinded rater panel, working CSV export suite + data dictionary,
all tests green, zero console errors.
