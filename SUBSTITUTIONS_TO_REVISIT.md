# Substitutions to revisit — tool vs. proposal

Short memory list of where the **tool** intentionally differs from, or operationalises, the
**research proposal**, what still has to be done later, and **why** each choice is defensible.
We are aligning the *tool* to the proposal; a few items still need a *proposal* re-word.

Status legend: ✅ done in the tool · ✍️ reword the proposal · ⏳ later work · 🔬 finalise with supervisor

---

## 1. Session-2 delay → 5-minute break (for now) ⏳
- **Proposal:** Session 2 happens **24–72 hours later** (delayed independence).
- **Tool now:** a **5-minute break** (`BREAK_DURATION_SECONDS=300`), then auto-advance to Session 2 in
  the same sitting.
- **Why for now:** lets us pilot the full flow end-to-end today without scheduling return visits; the
  resume-by-code design already supports a participant coming back another day and re-entering their code.
- **Remember later:** add a real gate after Session-1 scales — end the sitting, mark "awaiting Session 2",
  and let the proctor (or a time lock) **release** Session 2 on the return visit. Until then we are
  measuring **immediate**, not **delayed**, independence — say so in any write-up.

## 2. AI mechanism → Offline Hint Bank + proctor-supervised real AI (no integration) ✅ ✍️
- **Proposal:** the AI group uses **live ChatGPT**.
- **Tool now:** Session-1 assistance is the **Offline Hint Bank** (structured ladder, levels 0–3). Real
  ChatGPT use is **not integrated**; instead the existing **Layer-2** path is used — a **physical proctor
  supervises** the real AI session and **manually logs** it (`layer2_logs`: prompt count, model, time).
- **Why:** honours the **offline-LAN constraint** (no external calls, runs on an island network) and avoids
  building/maintaining a live AI integration; the proctor supervision keeps the real-AI condition controlled
  and auditable.
- **Remember later:** ✍️ reword the proposal to describe (a) the hint-bank assistance condition and (b) the
  proctor-supervised Layer-2 mechanism for real AI. Only build a live integration if a fully-automated
  real-AI condition becomes a hard requirement (it breaks pure offline).

## 3. Warm-up tasks → keep four ✍️
- **Proposal:** **two** warm-up items. **Tool:** **four** (B0-1…B0-4).
- **Why:** four gives a slightly more stable baseline-ability estimate; harmless to the design.
- **Remember later:** ✍️ reword the proposal to "four". (No tool change.)

## 4. Questionnaire item counts → now follow the proposal ✅ 🔬
- **Proposal Appendix H:** S1 = **8 items** (H.0.1), AI-usage = **4 items, AI-only** (H.0.2),
  S2 = **6 items** (H.0.3); all 1–5.
- **Tool now matches those counts.** Concretely:
  - **S1 (everyone, 8):** Effort `S1-E1..E3`, Engagement `S1-H1..H3`, + Confidence/understanding
    `S1-C1`, `S1-U1`.
  - **AI-usage (AI only, 4):** `S1-AI1..AI4` (copied output / accepted without change / relied on AI /
    verified AI). **Replaces** the old 3-item trust block.
  - **S2 (everyone, 6):** Engagement `S2-H1..H3` + Independence `S2-I1..I3`. The old **3 S2 effort items
    were dropped** to hit the 6-item count.
- **Why:** the proposal’s counts drive how the data is analysed (COI/HES feature sets, Cronbach’s alpha);
  the tool should produce exactly those item sets.
- **Remember later / caveats:**
  - 🔬 The proposal gives **counts and themes only — not verbatim wording**. The **added** items
    (`S1-C1`, `S1-U1`, `S1-AI1..AI4`) are authored to the proposal’s themes and **must be finalised with
    the supervisor** before mass collection.
  - The proposal is internally inconsistent on **effort in Session 2**: §3.6.5 implies an effort scale
    after *each* block, but H.0.3 lists a 6-item S2 set without effort. We followed **H.0.3** (no S2
    effort) and kept Session-1 effort. Confirm this is acceptable, or restore S2 effort and re-count.
  - This also **departs from the CLAUDE.md "verbatim from MEGA_PROMPT D6" invariant** — by your
    instruction the **proposal**, not MEGA_PROMPT D6, is now the source for the scales. Update
    MEGA_PROMPT D6 to match so the two specs don’t drift.

## 5. Copy measure → binary copy tick (matches the proposal’s operational definition) ✅
- **Looks like a deviation but isn’t.** §3.6.3 *describes* Copy Rate conceptually as a proportion, but
  the proposal’s **feature-engineering step §3.7.4 defines it operationally**: *“computed from the **copy
  tick** recorded by the participant and spot checked by the researcher.”*
- **Tool:** the binary **“Copy used? Yes/No”** tick on each task (plus the hint `copied` flag) — exactly
  that input. **No tool change made.**
- **Why:** matching the proposal’s stated analysis input keeps the COI Copy-Rate feature reproducible.
  Capturing copied-text length for a true continuous ratio would *exceed* the proposal’s method; only do it
  if you decide to change §3.7.4.

## 6. H.0.5 cognitive-offloading / critical-thinking self-report (1–6, 4 items) ⏳
- **Proposal:** a separate 4-item, 1–6 scale (use digital tools to remember / search instead of thinking /
  compare sources / question AI outputs). **Tool:** not implemented (offloading is captured behaviourally).
- **Remember later:** decide to **add** it (Form 0 or post-block) or **drop** it from the proposal.

---

## Note on pilot data already collected
Any pilot responses captured **before** this change used the **old** scale set (S1 6/9 incl. trust;
S2 9 incl. effort). After deploying, new participants use the proposal-aligned set. Keep the two batches
separate in analysis, or re-collect the pilot.
