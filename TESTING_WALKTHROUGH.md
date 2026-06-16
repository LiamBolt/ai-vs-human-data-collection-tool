# Testing Walkthrough — "AI vs the Brain" Data Collection Tool

A click-through test plan for **every user of the system**, mapped against the research proposal
(`AI_vs_the_Brain__…​.pdf`). For each step it says **what to do**, **why it exists in the study**,
**what it produces**, and **what it depends on**. The last section is the scorecard:
**what matches the proposal, what we changed, and what is missing.**

> How to use this: launch the stack, then walk the four workflows in order (Proctor setup →
> Participant → Rater → Exports). Tick each box. When something is wrong, note the step number; the
> fixes are gathered in §6–§7.

**Launch:** `docker compose up -d --build` → open `http://<LAN-IP>/`. Bootstrap admin comes from
`ADMIN_BOOTSTRAP_USERNAME/PASSWORD` in `.env`. (Full LAN guide in `README.md`.)

---

## 0. The study in one picture (so the steps make sense)

The proposal measures **one causal chain** (proposal §3.3 Conceptual Framework):

```
   AI use in Session 1  ──►  Behaviour (how they used it)  ──►  Independent performance in Session 2
      (the INPUT)              (the PROCESS: COI + HES)              (the OUTCOME, AI removed)
```

- **Session 1** splits people into **Control** (no AI) and **AI-assisted**. We log *how* the AI group
  uses help: requests, copying, verification, time.
- **Session 2** removes AI for everyone and gives **parallel** tasks. This is the real test:
  *did relying on AI in S1 weaken solving-on-your-own later?*
- Two scores summarise S1 behaviour: **COI** (Cognitive Offloading Index = how much thinking was
  handed to AI) and **HES** (Human Engagement Score = how much the person still thought/verified).
- **COI and HES are NOT computed inside this tool.** The tool *collects the raw fields*; the analyst
  computes COI/HES/effect sizes later in pandas (proposal §3.6–§3.8). So testing the tool = testing
  **data capture**, not the statistics.

Everything below exists to capture one piece of that chain cleanly and anonymously.

---

## 1. The four users (test them in this order)

| # | User | Auth | When to test | Depends on |
|---|------|------|-------------|------------|
| 1 | **Proctor / Admin** | JWT login | First — nothing works without setup | — (independent; run first) |
| 2 | **Participant** | None (Participant ID only) | After a batch exists | Needs a batch + check-in (user 1) |
| 3 | **Rater** (blinded) | JWT login | After ≥1 participant submits tasks | Needs task responses (user 2) |
| 4 | **Analyst** (Exports) | JWT (Admin/Proctor) | Last | Needs collected data (users 2–3) |

---

## 2. Workflow A — Proctor / Admin setup (run FIRST, independent of participants)

Route base: `/proctor/login` → dashboard. This is **scaffolding**: it creates the containers that
participant data hangs off. Order matters because each item is a parent of the next.

| ✓ | Step | Do this | Why it exists (proposal) | Produces / feeds | Depends on |
|---|------|---------|--------------------------|------------------|------------|
| ☐ | A1 | Log in as admin (`/proctor/login`) | Staff are identified by a **code, never a name** (anonymity, §3.11.2) | JWT session | bootstrap admin in `.env` |
| ☐ | A2 | Create a **Site** (e.g. `UCU_MUKONO`) | Multi-site recruitment for variation (§3.4.1) | `sites` row | A1 |
| ☐ | A3 | Create a **Batch** under the site | A clinic day; groups participants for sequential ID counter | `batches` row | A2 |
| ☐ | A4 | (Admin) Create a **Rater** staff user | Blinded scoring later (§3.6.6, §3.10.2) | `staff_users` (RATER) | A1 |
| ☐ | A5 | **Check-in** a participant (`/proctor/checkin`): pick batch → confirm consent → Generate ID | Issues the **only identity key**, race-safe sequential code (§3.5.1) | `participant_code` (hand to participant) | A3 |
| ☐ | A6 | Leave Form 0 to the participant; when it completes, the **assignment card** appears | Group split = the experiment's independent variable (§3.4.5) | Suggested group + stratum counts | A5 + participant Form 0 |
| ☐ | A7 | **Accept** suggested group or **Override** (reason required) | Researcher control + audit trail | `group_assignment`, `assignment_method` | A6 |
| ☐ | A8 | **Monitor** (`/proctor/monitor`, 5s refresh) | Live proctoring; catch infractions; warm-up override | live roster, warm-up override | A5 |
| ☐ | A9 | Log a **Deviation** if anything goes off-script | Governance/defence log (§3.11) | `deviation_logs` | A3 |
| ☐ | A10 | **Layer 2 entry** (only if using live ChatGPT calibration) | Manually record prompt count, model, time-in-tool | `layer2_logs` | A5 |

**Dependency summary:** Site → Batch → Check-in → (participant does Form 0) → Assignment. A2–A4 are
independent of any participant. A6–A7 **rely on the participant finishing Form 0** (cross-user
handoff — test with two devices/tabs).

> ⚠️ **Check against proposal:** the tool uses **stratified** assignment (education × AI-familiarity)
> with proctor override. The proposal §3.4.5 says **simple random / alternating**. This is a
> *deliberate upgrade* (better balance) but it **deviates from the written method** — decide whether
> to (a) keep it and update the proposal text to "stratified assignment", or (b) switch to random.

---

## 3. Workflow B — Participant lifecycle (the core; strictly sequential, forward-only)

This is the heart of the study. Every step is **forward-only** and **auto-saved** (localStorage +
30s sync). Kill the tab anywhere → re-enter the code at `/` → you resume on the exact step. Test that
recovery at least once (proposal resilience requirement).

| ✓ | Step | Route | What the participant does | Why it exists (proposal) | Produces / feeds | Depends on |
|---|------|-------|---------------------------|--------------------------|------------------|------------|
| ☐ | B1 | `/` | Enter Participant ID | Code-keyed identity, no login (anonymity) | resume payload | A5 (code issued) |
| ☐ | B2 | `/consent` | Read consent → tick agree (or decline → withdrawn) | Informed consent, voluntary, anonymous (§3.11.1) | `consent_given`, timestamp | B1 |
| ☐ | B3 | `/form0` | 5 background fields + **4 warm-up items** | Covariates (education, AI familiarity…) + **baseline ability** before AI (§3.4.4) | demographics, `warmup_auto_score` | B2 |
| ☐ | B4 | `/waiting` | "Wait for your proctor to confirm your group" (polls every 5s) | The group split happens here (handoff to proctor A7) | unblocks on assignment | B3 + **A7** |
| ☐ | B5 | `/s1/intro` | Read **group-specific rules**, Start Session 1 | Standardised instructions; control vs AI rules differ (§3.5.5, D5) | `SESSION_START` telemetry | B4 |
| ☐ | B6 | `/s1/task/A1…C2` | **6 tasks in order**: answer → justify (≥30 chars) → checks | S1 performance + behaviour; the COI/HES raw inputs (§3.5–§3.6) | `task_responses` ×6, telemetry | B5; tasks must be in order |
| ☐ | B6-AI | (left panel, AI group only) | **Assistance ladder** L1→L2→L3, sequential; Copy used? Verified? + evidence | Captures **AI reliance + verification** = COI features (§3.6.2) | `assistance_level`, `requests_count`, `copy_used`, `verified`, hint_events | group = AI_ASSISTED |
| ☐ | B6-C | (control group only) | Compliance tick "I did not use AI…" | Keeps control clean (no-AI condition) | `control_compliance` | group = CONTROL |
| ☐ | B7 | `/s1/scales` | Likert grid: Effort + Engagement (+ **Trust, AI only**) | Self-reported effort/engagement → HES; trust → calibration (§3.6.4, D6) | `scale_responses` (S1) | B6 done |
| ☐ | B8 | `/break` | Radial countdown, then **auto-advances to Session 2** | "Short rest between sessions" | `break_ends_at`, BREAK_END | B7 |
| ☐ | B9 | `/s2/intro` | "AI removed for everyone." Arms paste-block + tab modal | Session 2 = the **independence test** (§3.2) | enforcement armed | B8 |
| ☐ | B10 | `/s2/task/A3…B4` | **4 parallel tasks**, no AI panel, paste blocked | Delayed independent performance = **primary endpoint** Accuracy_S2 (§3.6.1) | `task_responses` ×4, infractions | B9; order enforced |
| ☐ | B11 | `/s2/transfer` | "Did you use a method from S1?" Yes/No (+1 line) | Detects transfer of learned method (§3.5) | `transfer_prompt_used/_text` | B10 |
| ☐ | B12 | `/s2/scales` | Likert: Effort + Engagement + **Independence** | S2 engagement + self-rated independence (§3.6.4, D6) | `scale_responses` (S2) | B11 |
| ☐ | B13 | `/complete` | Thank-you; shows code for proctor checklist; status COMPLETED | Debrief + close-out (§3.11.4) | status COMPLETED | B12 |

**Things to verify while clicking (these are the proposal's hard rules — "server is law"):**

- ☐ Justification under 30 chars is **rejected** (button stays disabled; server 422).
- ☐ AI group: Level 2 is locked until Level 1 is opened (no skipping); hint copy is logged.
- ☐ Verified = Yes **forces** a verification method + one-sentence evidence.
- ☐ Control group never sees the Assistance panel.
- ☐ Session 2: **paste is blocked**, tab-switch shows the modal and logs an infraction.
- ☐ Session 2: hint request returns **403** (try it via the API; must be impossible by route + API).
- ☐ Break cannot be skipped by refreshing (timer recomputed from server).
- ☐ Kill tab mid-task → re-enter code → resume same step with the draft intact.

**Dependency summary:** B1→B13 is a strict chain. The only **cross-user** dependency is **B4 ↔ A7**
(participant waits for proctor to set the group). The scientific dependency that the *analysis* later
relies on: **B6 (S1 behaviour) explains B10 (S2 outcome)** — but inside the tool they're just two
independent captures.

---

## 4. Workflow C — Rater (blinded scoring; run AFTER a participant has submitted tasks)

Route: `/rater/login` → `/rater/queue`.

| ✓ | Step | Do this | Why it exists (proposal) | Produces | Depends on |
|---|------|---------|--------------------------|----------|------------|
| ☐ | C1 | Log in as the rater (from A4) | Separate blinded role | JWT | A4 |
| ☐ | C2 | Open a queued response | Rubric scoring of **justification quality** (§3.6.1) | — | a `task_responses` exists (B6/B10) |
| ☐ | C3 | Score 3 axes 0–2: Correctness, Justification quality, Independence | Quality of reasoning, not just the answer (§3.5.2, D7) | `rater_scores` | C2 |
| ☐ | C4 | Confirm **double-scoring** appears (~20% of items go to 2 raters) | Inter-rater reliability ICC/kappa (§3.6.6, §3.10.2) | `is_double_score` | A4 (≥2 raters) |

**The blinding test (must pass):** in the rater queue, you must see **only** the question, the
objective answer, and the justification text. You must **never** see participant_code, group,
hint/assistance fields, telemetry, confidence, or timers (§3.11.2; "BLINDING" invariant). ☐ Verify in
the UI **and** in the network response.

---

## 5. Workflow D — Analyst / Exports (run LAST)

Route: `/proctor/exports` (Admin/Proctor).

| ✓ | Step | Do this | Why it exists | Depends on |
|---|------|---------|---------------|------------|
| ☐ | D1 | Download each CSV (participants, task_responses, telemetry, hint_events, scales, rater_scores, session_meta, deviations, layer2) | Tidy dataset for analysis (§3.7, §4.1) | data collected |
| ☐ | D2 | Download `data_dictionary.csv` | Reproducibility — every variable defined (§3.7.5) | — |
| ☐ | D3 | Load all in pandas, merge on `participant_code` (+ session/task) | Merged dataset = the analysis base (§3.7.2) | D1 |
| ☐ | D4 | Confirm `user_agent_raw` is **absent** and no names/IPs anywhere | Anonymity in exports (§3.11.2) | D1 |

> ⚠️ **COI, HES, Cohen's d, Cronbach's α, the prediction model — none of these are in the tool.** They
> are computed downstream from these CSVs (proposal §3.6–§3.8, §4). The tool's job is to make D1–D4
> clean and complete. That separation is correct, but **be aware: there is no analysis code shipped
> here to test.** If you expected the tool to show COI/HES, that's a scope boundary, not a bug.

---

## 6. Does the workflow match the proposal? — Scorecard

### ✅ Matches the proposal (should just work — verify, don't change)

- Two groups (Control / AI-assisted); two sessions; **S2 = AI removed independence test** (§3.2).
- Baseline warm-up **before** AI to measure prior ability (§3.4.4).
- Form 0 covariates: age, education, English comfort, AI-use frequency, AI confidence (§3.4.4).
- Six task families incl. arithmetic, percent/average, logic, time, interest, cost comparison; **parallel forms** in S2 (§3.5.3–§3.5.4).
- Objective score + **justification** per task; per-task **copy / verified / verification-method / evidence / confidence / familiarity / self-check** = the COI/HES raw inputs (§3.6.2).
- Post-block **Effort + Engagement** scales; **Trust** items AI-only (§3.6.4).
- **Rubric 0–2 × 3** + blinded rater + **≥20% double-scoring** (§3.6.6, §3.10.2).
- **Anonymity**: `participant_code` only; no names/IPs; `user_agent_raw` excluded from exports (§3.11.2).
- **Tidy CSV exports + data dictionary**; telemetry of time, prompts, copy, verification, paste, tab (§3.7, H.0.6).

### ⚠️ Deviations (decide: keep + update the proposal text, OR change the tool)

1. **AI mechanism — biggest one.** Proposal: AI group uses **live ChatGPT** under protocol (§3.5.5,
   abstract). Tool: an **Offline Hint Bank** (structured ladder, levels 0–3) as the S1 AI proxy, plus
   an optional **Layer-2** path where a proctor *manually* logs real ChatGPT usage. This is required by
   the **offline-LAN constraint**, but it means S1 "AI use" ≠ ChatGPT. **Decide:** (a) accept the hint
   bank as the controlled-AI condition and reword the proposal to describe it, or (b) add a real
   ChatGPT integration for Layer-2 clinics (breaks pure offline). Today only (a) is implemented end-to-end.

2. **Session-2 delay — biggest one.** Proposal: S2 happens **24–72 hours later** (delayed
   independence). Tool: a **5-minute break** (`BREAK_DURATION_SECONDS=300`) then **auto-advances to S2
   in the same sitting**. There is **no 24–72h gate** in the code. The resume-by-code design *could*
   support a real return (participant comes back next day, re-enters code), but nothing **stops** the
   same-day flow or **schedules** the return. **Decide & change:** add a stop after B7/B8 — end the
   sitting, mark "awaiting Session 2", and let the proctor (or a time gate) **release** S2 on the
   return visit. As-is, you are measuring *immediate* independence, not *delayed* independence — which
   changes the core finding.

3. **Warm-up count.** Proposal §3.4.4/§3.5.1: **two** warm-up tasks. Tool: **four** (B0-1…B0-4).
   Harmless, but reword the proposal to "four" or drop two.

4. **Questionnaire item counts.** Proposal Appendix H: S1 = **8 items**, S2 = **6 items**, plus a
   separate **4-item AI-usage** questionnaire (H.0.2). Tool (from `instruments.py`): S1 = 6 (control) /
   9 (AI incl. 3 trust); S2 = **9** (Effort 3 + Engagement 3 + Independence 3); AI usage captured via
   **per-task fields + 3 trust items**, not a separate 4-item block. **Reconcile** the proposal's
   Appendix H numbers with the actual D6 item set (the tool's set is the more precise one).

5. **Copy measure.** Proposal §3.6.2: `Copy_Rate = Copied_AI_Text / Total_Final_Text` (a **proportion**).
   Tool: a **binary** "Copy used? Yes/No" tick (+ a `copied` flag on hints). So Copy_Rate will be
   binary, not continuous. **Decide:** accept the binary proxy (document it) or capture copied-text
   length to compute a true ratio.

6. **Assignment method** — see §2 note (stratified vs simple-random).

### ❌ Not done yet (missing vs the proposal)

1. **H.0.5 cognitive-offloading / critical-thinking self-report scale** (1–6 scale, 4 items: "use
   digital tools to remember", "search online instead of thinking first", "compare multiple sources",
   "question AI outputs"). **Not in the tool.** The tool measures offloading *behaviourally* (arguably
   better), but this **self-report scale is absent**. Add it to Form 0 / post-block, or drop it from
   the proposal.

2. **"Time in tool" / Time_Offload aggregate.** Proposal §3.6.2: `Time_Offload = Time_AI/(Time_AI+Time_Human)`.
   The tool has split timers (objective vs justification) and hint `viewed_duration_ms`, but **no clean
   per-task "time spent in assistance"** aggregate for the hint bank; for Layer-2 it's a manual proctor
   number. **Confirm** the analyst can reconstruct Time_AI from hint view durations, or add an explicit
   timer on the Assistance panel.

3. **No analysis/scoring code** for COI, HES, effect sizes, Cronbach's α, the prediction model (§3.6–§3.8,
   §4). **By design** these live downstream — but they don't exist anywhere in this repo yet, so the
   proposal's "code that reproduces all results" is still **to be written** (separate from this tool).

---

## 7. The decisions you must make (do these before mass data collection)

These are the only blockers; everything else is "verify and tick".

1. **Delay (Deviation #2):** Same-sitting 5-min break, or true 24–72h return? → If 24–72h, the break/
   release flow must change. *This affects the headline result, so decide first.*
2. **AI mechanism (Deviation #1):** Is the Offline Hint Bank the official "AI condition", or must
   Layer-2 use real ChatGPT? → Reword the proposal, or build the integration.
3. **Questionnaires (Deviations #3–#4, Missing #1):** Lock the exact item sets so Appendix H and the
   tool agree, including whether to add the H.0.5 1–6 offloading scale.
4. **Copy measure (Deviation #5):** Binary tick (document as proxy) or true Copy_Rate.

Once 1–4 are settled, this walkthrough becomes a clean pass/fail checklist for piloting.

---

*Generated to be walked top-to-bottom while clicking through the running app. Step IDs (A#, B#, C#,
D#) are stable references — quote them when reporting what to change.*
