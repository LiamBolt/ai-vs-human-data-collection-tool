# Graph Report - .  (2026-06-27)

## Corpus Check
- 144 files · ~144,559 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 973 nodes · 2279 edges · 82 communities (73 shown, 9 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 310 edges (avg confidence: 0.56)
- Token cost: 143,272 input · 25,281 output

## Community Hubs (Navigation)
- [[_COMMUNITY_DB Enum Types|DB Enum Types]]
- [[_COMMUNITY_Workspace & Proctor Layout|Workspace & Proctor Layout]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Proctor API Client|Proctor API Client]]
- [[_COMMUNITY_API Types & Payloads|API Types & Payloads]]
- [[_COMMUNITY_Auth & Staff Management|Auth & Staff Management]]
- [[_COMMUNITY_COIHES Research Constructs|COI/HES Research Constructs]]
- [[_COMMUNITY_Error Envelope|Error Envelope]]
- [[_COMMUNITY_Participant Flow Service|Participant Flow Service]]
- [[_COMMUNITY_ORM Data Models|ORM Data Models]]
- [[_COMMUNITY_Assignment Automation Service|Assignment Automation Service]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Layer 2 & Rater UI|Layer 2 & Rater UI]]
- [[_COMMUNITY_Auth UI & Shared Components|Auth UI & Shared Components]]
- [[_COMMUNITY_CSV Export Service|CSV Export Service]]
- [[_COMMUNITY_Break Timer & Utils|Break Timer & Utils]]
- [[_COMMUNITY_Staff & Verification UI|Staff & Verification UI]]
- [[_COMMUNITY_App Config & Entrypoint|App Config & Entrypoint]]
- [[_COMMUNITY_Proctor Router Endpoints|Proctor Router Endpoints]]
- [[_COMMUNITY_Session Sync & Task Routing|Session Sync & Task Routing]]
- [[_COMMUNITY_Security & JWT Guards|Security & JWT Guards]]
- [[_COMMUNITY_MSW Dev Mocks|MSW Dev Mocks]]
- [[_COMMUNITY_Test Fixtures & Role Guard|Test Fixtures & Role Guard]]
- [[_COMMUNITY_API Test Helpers|API Test Helpers]]
- [[_COMMUNITY_Post-Block Scales UI|Post-Block Scales UI]]
- [[_COMMUNITY_Database Engine & Migrations|Database Engine & Migrations]]
- [[_COMMUNITY_Blinded Rater Service|Blinded Rater Service]]
- [[_COMMUNITY_Auto-Scoring Engine|Auto-Scoring Engine]]
- [[_COMMUNITY_Design & Telemetry Decisions|Design & Telemetry Decisions]]
- [[_COMMUNITY_Form 0 Intake UI|Form 0 Intake UI]]
- [[_COMMUNITY_Session Store State|Session Store State]]
- [[_COMMUNITY_Session Repository|Session Repository]]
- [[_COMMUNITY_Backend Invariants & Decisions|Backend Invariants & Decisions]]
- [[_COMMUNITY_Project Spec & Modules|Project Spec & Modules]]
- [[_COMMUNITY_Journey Progress UI|Journey Progress UI]]
- [[_COMMUNITY_Task Submit Tests|Task Submit Tests]]
- [[_COMMUNITY_Deployment & Infra|Deployment & Infra]]
- [[_COMMUNITY_Participant Flow Router|Participant Flow Router]]
- [[_COMMUNITY_Export Download UI|Export Download UI]]
- [[_COMMUNITY_Verbatim Instruments|Verbatim Instruments]]
- [[_COMMUNITY_Seed & Bootstrap|Seed & Bootstrap]]
- [[_COMMUNITY_TS Node Config|TS Node Config]]
- [[_COMMUNITY_Resume & Completion Flow|Resume & Completion Flow]]
- [[_COMMUNITY_Justification Field UI|Justification Field UI]]
- [[_COMMUNITY_Core Invariants & Flow|Core Invariants & Flow]]
- [[_COMMUNITY_Assistance Panel UI|Assistance Panel UI]]
- [[_COMMUNITY_Logo Brand Identity (public)|Logo Brand Identity (public)]]
- [[_COMMUNITY_Logo Brand Identity (src)|Logo Brand Identity (src)]]
- [[_COMMUNITY_Alembic Migration Env|Alembic Migration Env]]
- [[_COMMUNITY_Instruments & Proposal Alignment|Instruments & Proposal Alignment]]
- [[_COMMUNITY_Export Tests|Export Tests]]
- [[_COMMUNITY_Hint Guard Tests|Hint Guard Tests]]
- [[_COMMUNITY_Rater Blinding Tests|Rater Blinding Tests]]
- [[_COMMUNITY_Assistance & Session-2 Decisions|Assistance & Session-2 Decisions]]
- [[_COMMUNITY_Auth Tests|Auth Tests]]
- [[_COMMUNITY_Telemetry Hook Tests|Telemetry Hook Tests]]
- [[_COMMUNITY_Task Data Definitions|Task Data Definitions]]
- [[_COMMUNITY_Confidence Rating UI|Confidence Rating UI]]
- [[_COMMUNITY_Consent UI|Consent UI]]
- [[_COMMUNITY_E2E Smoke Test|E2E Smoke Test]]
- [[_COMMUNITY_Study Sampling|Study Sampling]]
- [[_COMMUNITY_Human-AI Trust Concepts|Human-AI Trust Concepts]]
- [[_COMMUNITY_PG Enum Helper|PG Enum Helper]]
- [[_COMMUNITY_Vite Env Types|Vite Env Types]]
- [[_COMMUNITY_Cross-Validation Method|Cross-Validation Method]]
- [[_COMMUNITY_Task Families & Parallel Forms|Task Families & Parallel Forms]]
- [[_COMMUNITY_Backend Package Init|Backend Package Init]]
- [[_COMMUNITY_Container Entrypoint|Container Entrypoint]]
- [[_COMMUNITY_Data Cleaning|Data Cleaning]]
- [[_COMMUNITY_Definition of Done|Definition of Done]]

## God Nodes (most connected - your core abstractions)
1. `uuid` - 46 edges
2. `useSessionStore` - 37 edges
3. `GroupAssignment` - 34 edges
4. `ParticipantStatus` - 34 edges
5. `request()` - 31 edges
6. `AiUseFrequency` - 22 edges
7. `AgeBand` - 21 edges
8. `EducationLevel` - 21 edges
9. `AnswerType` - 21 edges
10. `VerificationMethod` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Module A — Architect (Monorepo/Docker)` --references--> `Docker Compose Stack`  [INFERRED]
  MEGA_PROMPT.md → docker-compose.yml
- `AI Mechanism = Hint Bank + Proctor-Supervised Layer 2` --conceptually_related_to--> `Assistance Panel / Offline Hint Bank UI (C6)`  [INFERRED]
  SUBSTITUTIONS_TO_REVISIT.md → MEGA_PROMPT.md
- `aivb-backend Render Service` --semantically_similar_to--> `backend Service (FastAPI)`  [INFERRED] [semantically similar]
  render.yaml → docker-compose.yml
- `Pinned Technology Stack` --conceptually_related_to--> `Backend Python Requirements`  [INFERRED]
  CLAUDE.md → backend/requirements.txt
- `Server Is Law Invariant` --conceptually_related_to--> `API Surface (B2)`  [INFERRED]
  CLAUDE.md → MEGA_PROMPT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Three-Service LAN Stack** — docker_compose_db_service, docker_compose_backend_service, docker_compose_frontend_service [EXTRACTED 0.95]
- **Study Causal Chain Capture (Input/Process/Outcome)** — testing_walkthrough_causal_chain, mega_prompt_telemetry_engine, mega_prompt_coi_hes, mega_prompt_session2_sacred [INFERRED 0.75]
- **Questionnaire Realignment to Proposal** — decisions_d021_questionnaire_counts, mega_prompt_d6_scale_items, research_proposal_appendix_h, substitutions_to_revisit [INFERRED 0.85]
- **COI Four Behavioural Features** — ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_cognitive_offloading_index, ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_ai_use_ratio, ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_time_in_tool, ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_copy_rate, ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_verification_rate [EXTRACTED 1.00]
- **Three Research Gaps** — ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_measurement_gap, ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_delayed_endpoint_gap, ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_validity_gap [EXTRACTED 1.00]
- **Input-Process-Outcome Flow** — ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_conceptual_framework, ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_ai_assisted_group, ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_cognitive_offloading_index, ai_vs_the_brain__a_data_science_study_on_cognitive_offloading_and_human_engagement_in_problem_solving_session_2_independence_test [INFERRED 0.85]

## Communities (82 total, 9 thin omitted)

### Community 0 - "DB Enum Types"
Cohesion: 0.22
Nodes (51): AgeBand, AiUseFrequency, AnswerType, AssignmentMethod, DeviceCategory, EducationLevel, GroupAssignment, ParticipantStatus (+43 more)

### Community 1 - "Workspace & Proctor Layout"
Cohesion: 0.05
Nodes (39): MobileView, SplitWorkspace(), SplitWorkspaceProps, TabButtonProps, getAwaitingCount(), queryClient, WithdrawnPage(), ADMIN_NAV_ITEMS (+31 more)

### Community 2 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (38): dependencies, @fontsource/inter, react, react-dom, react-router-dom, @tanstack/react-query, zustand, devDependencies (+30 more)

### Community 3 - "Proctor API Client"
Cohesion: 0.09
Nodes (22): checkInParticipant(), createBatch(), createDeviation(), createSite(), getAssignmentSuggestion(), getBatches(), getMonitor(), getSites() (+14 more)

### Community 4 - "API Types & Payloads"
Cohesion: 0.12
Nodes (31): AnswerType, AssignmentPayload, AssignmentSuggestion, Batch, BreakStartResponse, BreakStatusResponse, CheckInPayload, CheckInResponse (+23 more)

### Community 5 - "Auth & Staff Management"
Cohesion: 0.13
Nodes (23): AdminDep, StaffRole, hash_password(), verify_password(), create_staff(), list_staff(), login(), Auth router — login plus ADMIN-only staff management. (+15 more)

### Community 6 - "COI/HES Research Constructs"
Cohesion: 0.09
Nodes (25): Accuracy_S2 (Primary Endpoint), Group B (AI-Assisted, ChatGPT), AI Protocol for Group B, AI Use Ratio, Augmentation vs Substitution, Between-Groups Experimental Design, Cognitive Load Theory, Cognitive Offloading (+17 more)

### Community 7 - "Error Envelope"
Cohesion: 0.14
Nodes (23): Any, app_error_handler(), AppError, ConflictError, _envelope(), ForbiddenError, NotFoundError, Application exception hierarchy and the consistent error envelope.  Every handle (+15 more)

### Community 8 - "Participant Flow Service"
Cohesion: 0.12
Nodes (24): BreakStartResponse, BreakStatusResponse, Form0Response, break_status(), start_break(), submit_form0(), _audit_infraction(), break_status() (+16 more)

### Community 9 - "ORM Data Models"
Cohesion: 0.19
Nodes (22): Base, Declarative base for all ORM models., Batch, DeviationLog, Hint, HintEvent, Layer2Log, RaterScore (+14 more)

### Community 10 - "Assignment Automation Service"
Cohesion: 0.13
Nodes (21): Batch, GroupAssignment, _ai_bucket(), _apply_assignment(), awaiting_assignment_count(), _batch_out(), _compute_suggestion(), create_batch() (+13 more)

### Community 11 - "TypeScript Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+13 more)

### Community 12 - "Layer 2 & Rater UI"
Cohesion: 0.14
Nodes (13): ContextPanel(), ContextPanelProps, createLayer2Log(), getRaterQueue(), submitRaterScore(), Session1IntroPage(), Session2IntroPage(), SegmentedScore (+5 more)

### Community 13 - "Auth UI & Shared Components"
Cohesion: 0.17
Nodes (14): ProgressStepper(), ProgressStepperProps, login(), ProctorLoginPage(), BrandLogo(), BrandLogoProps, Button, ButtonProps (+6 more)

### Community 14 - "CSV Export Service"
Cohesion: 0.20
Nodes (19): Static data-dictionary registry powering GET /exports/data_dictionary.csv.  One, AsyncSession, build_export(), _cell(), _data_dictionary(), _deviation_logs(), export_csv(), export_meta() (+11 more)

### Community 15 - "Break Timer & Utils"
Cohesion: 0.15
Nodes (16): BreakTimerResult, useBreakTimer(), completeBreak(), getBreakStatus(), startBreak(), clamp(), ClassValue, debounce() (+8 more)

### Community 16 - "Staff & Verification UI"
Cohesion: 0.15
Nodes (14): createStaff(), getStaff(), setStaffActive(), submitTransferPrompt(), TransferPromptPage(), METHOD_OPTIONS, VerificationFields(), VerificationFieldsProps (+6 more)

### Community 17 - "App Config & Entrypoint"
Cohesion: 0.15
Nodes (14): get_settings(), Application configuration loaded from environment variables (Pydantic Settings)., Settings, Shared FastAPI dependencies., lifespan(), FastAPI application entrypoint — lifespan (seed/bootstrap), routers, error envel, BaseSettings, ExportMeta (+6 more)

### Community 18 - "Proctor Router Endpoints"
Cohesion: 0.29
Nodes (18): DbSession, download(), uuid, assignment_suggestion(), awaiting_count(), check_in(), create_batch(), create_deviation() (+10 more)

### Community 19 - "Session Sync & Task Routing"
Cohesion: 0.16
Nodes (14): useSessionSync(), useTelemetry(), syncState(), getNextStep(), getNextTaskRoute(), getTaskIndex(), getTotalTasks(), S1TaskCode (+6 more)

### Community 20 - "Security & JWT Guards"
Cohesion: 0.18
Nodes (12): RateLimitError, UnauthorizedError, decode_token(), get_current_staff(), LoginRateLimiter, ProctorPresence, Password hashing, JWT issuance/verification, and role-guard dependencies., In-memory record of the last time any proctor/admin made a request.      LAN-gra (+4 more)

### Community 21 - "MSW Dev Mocks"
Cohesion: 0.15
Nodes (11): worker, handlers, HINTS, MockStaff, staffStore, WelcomePage(), prepare(), server (+3 more)

### Community 22 - "Test Fixtures & Role Guard"
Cohesion: 0.16
Nodes (11): create_access_token(), Dependency factory enforcing that the caller holds one of the given roles., require_role(), StaffRole, client(), _make_staff(), proctor(), rater_a() (+3 more)

### Community 23 - "API Test Helpers"
Cohesion: 0.19
Nodes (13): AsyncClient, device_payload(), assign(), check_in(), correct_answer_for(), Shared test helpers that drive the API through a participant lifecycle., submit_all_session1(), submit_all_session2() (+5 more)

### Community 24 - "Post-Block Scales UI"
Cohesion: 0.14
Nodes (13): submitScales(), LABELS, S1_AI_USAGE, S1_CONFIDENCE, S1_EFFORT, S1_ENGAGEMENT, S2_ENGAGEMENT, S2_INDEPENDENCE (+5 more)

### Community 25 - "Database Engine & Migrations"
Cohesion: 0.15
Nodes (9): _build_engine_args(), get_db(), Async SQLAlchemy engine, session factory, and declarative base., Normalize a DB URL for SQLAlchemy + asyncpg.      Handles managed Postgres (e.g., FastAPI dependency yielding a request-scoped async session., Block (with exponential backoff) until the database accepts a SELECT 1., wait_for_db(), main() (+1 more)

### Community 26 - "Blinded Rater Service"
Cohesion: 0.18
Nodes (10): datetime, queue(), Rater router (JWT, RATER role only)., submit_score(), RaterQueueItem, RaterScoreRequest, Rater (blinded) schemas — expose nothing that could deanonymize or bias scoring., queue() (+2 more)

### Community 27 - "Auto-Scoring Engine"
Cohesion: 0.23
Nodes (11): _extract_number(), _normalize(), _normalize_yes_no(), Deterministic auto-scoring for warm-up items (D2) and task objectives (D3)., Lowercase and strip all whitespace — matches the normalized WARMUP_KEYS sets., Pull the first numeric value out of a free-text answer (commas/units tolerated)., Return 0–4: one point per warm-up item that matches its D2 acceptance set., Auto-correctness of an objective answer against the fixed D3 key.      `task` is (+3 more)

### Community 28 - "Design & Telemetry Decisions"
Cohesion: 0.18
Nodes (12): Design System Tokens, Resilience / Dual-Layer Persistence Invariant, D014 — Light/Dark Theming + Glassmorphism, D016 — Idempotent Telemetry via client_event_id, Frontend index.html Entry, Pre-Paint Theme Script, COI / HES Analysis Targets, Module C — Frontend Engineer (React) (+4 more)

### Community 29 - "Form 0 Intake UI"
Cohesion: 0.17
Nodes (11): submitForm0(), AGE_OPTIONS, AgeBand, AiFrequency, EDUCATION_OPTIONS, EducationLevel, Errors, Form0Page() (+3 more)

### Community 30 - "Session Store State"
Cohesion: 0.29
Nodes (11): INITIAL_STATE, persistState, SessionStore, GroupAssignment, HintTaskProgress, HintTaskState, ParticipantStatus, SessionNumber (+3 more)

### Community 31 - "Session Repository"
Cohesion: 0.24
Nodes (10): Participant, ParticipantState, CheckInResponse, check_in(), get_participant_by_code(), get_state(), persist_telemetry(), Session repository — participant lookups and idempotent telemetry persistence. (+2 more)

### Community 32 - "Backend Invariants & Decisions"
Cohesion: 0.20
Nodes (11): Blinding Invariant, Server Is Law Invariant, D004 — JWT Storage Strategy, D015 — Models Consolidated in app/models.py, D017 — Race-Safe Participant Codes, D019 — Group Assignment After Form 0, D020 — ADMIN-only Staff Management, API Surface (B2) (+3 more)

### Community 33 - "Project Spec & Modules"
Cohesion: 0.25
Nodes (11): Instruction Hierarchy, Agent Operating Rules (CLAUDE.md), Pinned Technology Stack, D001 — MSW Dev Mocks, Ambiguity Resolutions Log (DECISIONS.md), Module A — Architect (Monorepo/Docker), Module E — Testing & Debugging Protocol, Module F — Implementation Phases (+3 more)

### Community 34 - "Journey Progress UI"
Cohesion: 0.27
Nodes (8): FormProgressHeader(), FormProgressHeaderProps, getJourneyProgress(), JOURNEY_PHASES, JourneyPhaseKey, JourneyProgress, StepProgress(), StepProgressProps

### Community 35 - "Task Submit Tests"
Cohesion: 0.42
Nodes (10): task_payload(), Task-submit validation matrix + ordering + auto-correct., _ready_participant(), test_ai_columns_from_control_forbidden(), test_c2_combined_answer_autocorrect(), test_duplicate_submit_rejected(), test_happy_path_advances_and_autocorrects(), test_out_of_order_rejected() (+2 more)

### Community 36 - "Deployment & Infra"
Cohesion: 0.29
Nodes (10): Docker Compose Stack, backend Service (FastAPI), db Service (Postgres 16, localdb profile), frontend Service (nginx SPA), Neon / Managed Postgres Hosting, aivb-backend Render Service, aivb-frontend Render Static Site, Render Blueprint Deployment (+2 more)

### Community 37 - "Participant Flow Router"
Cohesion: 0.20
Nodes (9): HintResponse, complete_break(), Participant-flow router (no auth — keyed by participant_code + server state mach, request_hint(), submit_scales(), submit_task(), submit_transfer(), sync_state() (+1 more)

### Community 38 - "Export Download UI"
Cohesion: 0.20
Nodes (6): downloadExport(), getAuthHeader(), getExportMeta(), ApiError, EXPORT_DESCRIPTIONS, EXPORT_LABELS

### Community 39 - "Verbatim Instruments"
Cohesion: 0.28
Nodes (7): expected_scale_items(), Verbatim study instrument content (MEGA_PROMPT Module D).  Single source of trut, # NOTE: the proposal specifies the *counts and themes* but not verbatim wording., The exact set of scale item codes a participant must answer for a session., _participant_at_break(), Break anchoring: cannot complete before time, can after., test_break_cannot_complete_early_then_succeeds()

### Community 40 - "Seed & Bootstrap"
Cohesion: 0.36
Nodes (8): bootstrap_admin(), Idempotent seeder: loads instrument content (D3/D4) and bootstraps the admin.  S, run_seed(), seed_hints(), seed_sites(), seed_tasks(), Fresh schema + seeded instruments before each test for full isolation., _reset_schema()

### Community 41 - "TS Node Config"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include

### Community 42 - "Resume & Completion Flow"
Cohesion: 0.31
Nodes (6): resumeSession(), CompletionPage(), resolveStepRoute(), WaitingPage(), useSessionStore, SyncIndicator()

### Community 43 - "Justification Field UI"
Cohesion: 0.28
Nodes (4): JustificationField(), JustificationFieldProps, Textarea, TextareaProps

### Community 44 - "Core Invariants & Flow"
Cohesion: 0.29
Nodes (8): Anonymity Invariant, Offline-First Invariant, Tidy Data Invariant, D003 — Web Audio Break Chime, D018 — Resume Payload Omits Answer Key, Hard Constraints (Module 0), Participant Screen Flow (C7), AI Mechanism = Hint Bank + Proctor-Supervised Layer 2

### Community 45 - "Assistance Panel UI"
Cohesion: 0.32
Nodes (6): requestHint(), AssistancePanel(), AssistancePanelProps, LEVEL_LABELS, makeQC(), renderPanel()

### Community 46 - "Logo Brand Identity (public)"
Cohesion: 0.39
Nodes (8): AI vs the Brain Brand Identity, Blue and Green Gradient Palette, Crossing Dotted Data Stream, Human Figure Icon, Infinity Bowtie Connection, Minimalist Line Art Style, AI vs Human Logo Asset, Robot Face Icon

### Community 47 - "Logo Brand Identity (src)"
Cohesion: 0.36
Nodes (8): AI vs the Brain Logo Asset, AI versus Human Comparison Theme, Blue-to-Green Gradient Palette, Crossing Dotted Connector, Human Figure (Brain Symbol), Dual Circle Infinity Connection, Minimalist Line-Art Style, Robot Head (AI Symbol)

### Community 48 - "Alembic Migration Env"
Cohesion: 0.33
Nodes (5): do_run_migrations(), Alembic environment — async engine, metadata from app models., run_async_migrations(), run_migrations_online(), Connection

### Community 49 - "Instruments & Proposal Alignment"
Cohesion: 0.43
Nodes (7): Verbatim Instruments Invariant, D021 — Questionnaire Counts Aligned to Proposal, Post-Block Scale Items (D6), Module D — Seed Content (Verbatim), Research Proposal Appendix H, Substitutions to Revisit (Tool vs Proposal), Testing Walkthrough (Click-Through Plan)

### Community 50 - "Export Tests"
Cohesion: 0.48
Nodes (6): Export suite: every CSV parses in pandas, keys present, user_agent_raw absent., _seed_some_data(), test_all_exports_parse_in_pandas(), test_export_meta_lists_all(), test_participants_export_excludes_user_agent(), test_task_responses_merge_keys()

### Community 51 - "Hint Guard Tests"
Cohesion: 0.48
Nodes (6): _ai_participant(), Hint hard guards: group, session, sequential unlocking., test_control_group_forbidden(), test_level_skipping_forbidden(), test_sequential_unlock_and_text(), test_session2_forbidden()

### Community 52 - "Rater Blinding Tests"
Cohesion: 0.48
Nodes (6): _queue_len(), Rater blinding (character-level) + double-scoring assignment., _response_with_score_flag(), test_cannot_score_twice(), test_double_scoring_two_raters(), test_queue_is_blinded()

### Community 53 - "Assistance & Session-2 Decisions"
Cohesion: 0.40
Nodes (6): D002 — C2 Answer Storage Format, D005 — AssistancePanel Unmounting, Assistance Panel / Offline Hint Bank UI (C6), Tasks & Answer Keys (D3), Session 2 Is Sacred (AI Removed), Session-2 Delay Replaced by 5-min Break

### Community 56 - "Task Data Definitions"
Cohesion: 0.40
Nodes (4): SESSION1_ORDER, SESSION2_ORDER, TASK_DATA, Task

### Community 57 - "Confidence Rating UI"
Cohesion: 0.50
Nodes (3): ConfidenceRating(), ConfidenceRatingProps, LABELS

### Community 58 - "Consent UI"
Cohesion: 0.50
Nodes (3): ConsentPage(), Checkbox(), CheckboxProps

### Community 59 - "E2E Smoke Test"
Cohesion: 0.60
Nodes (4): event(), main(), End-to-end smoke test / demo — drives a full participant lifecycle via the API., task_body()

### Community 60 - "Study Sampling"
Cohesion: 0.67
Nodes (3): Convenience Sampling, Study Participants (Kampala Students and Adults), Warm-up Tasks Baseline Ability

### Community 61 - "Human-AI Trust Concepts"
Cohesion: 0.67
Nodes (3): Human-AI Interaction and Trust, Overreliance / Calibrated Reliance, Verification Friction Trade-off

### Community 62 - "PG Enum Helper"
Cohesion: 0.67
Nodes (3): _enum(), Build a PG native enum that stores the Enum *values* (not member names)., SAEnum

## Knowledge Gaps
- **180 isolated node(s):** `entrypoint.sh script`, `name`, `private`, `version`, `type` (+175 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `uuid` connect `Proctor Router Endpoints` to `DB Enum Types`, `Frontend Dependencies`, `Auth & Staff Management`, `Error Envelope`, `Participant Flow Service`, `ORM Data Models`, `Assignment Automation Service`, `Rater Blinding Tests`, `MSW Dev Mocks`, `Test Fixtures & Role Guard`, `API Test Helpers`, `Blinded Rater Service`, `E2E Smoke Test`, `Session Store State`, `Session Repository`?**
  _High betweenness centrality (0.405) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Frontend Dependencies` to `Proctor Router Endpoints`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Are the 32 inferred relationships involving `GroupAssignment` (e.g. with `AssignmentRequest` and `AssignmentSuggestion`) actually correct?**
  _`GroupAssignment` has 32 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Alembic environment — async engine, metadata from app models.`, `AI vs the Brain — research data collection backend.`, `Application configuration loaded from environment variables (Pydantic Settings).` to the rest of the system?**
  _259 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Workspace & Proctor Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.05450733752620545 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Proctor API Client` be split into smaller, more focused modules?**
  _Cohesion score 0.09206349206349207 - nodes in this community are weakly interconnected._