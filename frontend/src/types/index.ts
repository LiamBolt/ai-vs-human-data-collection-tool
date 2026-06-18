// ── Participant status state machine ──────────────────────────────────────────
export type ParticipantStatus =
  | 'CHECKED_IN'
  | 'FORM0'
  | 'SESSION1'
  | 'BREAK'
  | 'SESSION2'
  | 'SCALES_S2'
  | 'COMPLETED'
  | 'WITHDRAWN'

export type GroupAssignment = 'CONTROL' | 'AI_ASSISTED'
export type SessionNumber = 1 | 2
export type AnswerType = 'NUMERIC' | 'YES_NO' | 'TEXT'

export type TelemetryEventType =
  | 'PASTE'
  | 'PASTE_BLOCKED'
  | 'TAB_BLUR'
  | 'TAB_FOCUS'
  | 'ANSWER_REVISION'
  | 'HINT_UNLOCK'
  | 'HINT_COPY'
  | 'INFRACTION'
  | 'BREAK_START'
  | 'BREAK_END'
  | 'SESSION_START'
  | 'SESSION_END'

export type VerificationMethod =
  | 'RECOMPUTE'
  | 'ESTIMATE'
  | 'ALT_METHOD'
  | 'CONSISTENCY'
  | 'OTHER'

// ── Seed content types ────────────────────────────────────────────────────────
export interface Task {
  id: string
  task_code: string
  session_number: SessionNumber
  display_order: number
  family: string
  objective_question: string
  justification_prompt: string
  answer_type: AnswerType
  correct_answer: string
  answer_tolerance: number | null
  parallel_to: string | null
}

export interface Hint {
  id: string
  task_code: string
  level: 1 | 2 | 3
  hint_text: string
}

// ── Telemetry ─────────────────────────────────────────────────────────────────
export interface TelemetryEvent {
  client_event_id: string
  event_type: TelemetryEventType
  task_code: string | null
  session_number: SessionNumber
  client_timestamp_ms: number
  event_metadata: Record<string, unknown>
}

// ── Session / store types ─────────────────────────────────────────────────────
export interface TimerMarks {
  t_start: number
  t_select: number | null
  t_end: number | null
}

export interface HintTaskState {
  unlocked_level: number
  hints: Partial<Record<1 | 2 | 3, string>>
  copied: boolean
  request_count: number
  reveal_timestamps: Partial<Record<1 | 2 | 3, number>>
}

// ── API request/response shapes ───────────────────────────────────────────────
export interface HintTaskProgress {
  unlocked_level: number
  request_count: number
  hints: Partial<Record<1 | 2 | 3, string>>
}

export interface SessionResumeResponse {
  participant_code: string
  status: ParticipantStatus
  current_step: string
  group_assignment: GroupAssignment | null
  current_session: SessionNumber
  draft_responses: Record<string, unknown>
  break_ends_at: string | null
  current_task: Task | null
  hint_progress?: Record<string, HintTaskProgress>
}

export interface StateSyncPayload {
  participant_code: string
  current_step: string
  draft_responses: Record<string, unknown>
  telemetry_batch: TelemetryEvent[]
}

export interface Form0Payload {
  participant_code: string
  age_band: '18_24' | '25_34' | '35_44' | '45_PLUS'
  education_level: 'SECONDARY' | 'DIPLOMA' | 'DEGREE' | 'POSTGRAD'
  english_comfort: 1 | 2 | 3 | 4 | 5
  ai_use_frequency: 'NEVER' | 'MONTHLY' | 'WEEKLY' | 'DAILY'
  ai_confidence: 1 | 2 | 3 | 4 | 5
  warmup_b01_answer: string
  warmup_b02_answer: string
  warmup_b03_answer: string
  warmup_b04_answer: string
}

export interface Form0Response {
  status: 'FORM0'
  warmup_auto_score: number
  assignment_pending: true
}

export interface TaskSubmitPayload {
  participant_code: string
  session_number: SessionNumber
  task_code: string
  objective_answer: string
  text_justification: string
  task_familiarity: boolean
  self_check: boolean
  confidence_rating: 1 | 2 | 3 | 4 | 5
  control_compliance: boolean | null
  // AI group Session 1 only — null otherwise
  assistance_level: 0 | 1 | 2 | 3 | null
  requests_count: number | null
  copy_used: boolean | null
  verified: boolean | null
  verification_method: VerificationMethod | null
  verification_method_other: string | null
  verification_evidence: string | null
  // Timers (ms)
  duration_objective_ms: number
  duration_justification_ms: number
  duration_total_ms: number
  answer_change_count: number
  participant_notes: string | null
  telemetry_batch: TelemetryEvent[]
}

export interface TaskSubmitResponse {
  next_step: string
  session_complete: boolean
}

export interface HintRequestPayload {
  participant_code: string
  task_code: string
  level: 1 | 2 | 3
}

export interface HintResponse {
  hint_text: string
  level: 1 | 2 | 3
  task_code: string
}

export interface BreakStartResponse {
  break_ends_at: string
}

export interface BreakStatusResponse {
  remaining_seconds: number
  break_ends_at: string
}

export interface ScaleSubmitPayload {
  participant_code: string
  session_number: SessionNumber
  items: Array<{ item_code: string; rating: 1 | 2 | 3 | 4 | 5 }>
}

export interface TransferPromptPayload {
  participant_code: string
  used: boolean
  text: string | null
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export type StaffRole = 'PROCTOR' | 'RATER' | 'ADMIN'

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  role: StaffRole
  display_code: string
}

// ── Staff management (ADMIN only) ─────────────────────────────────────────────
export interface StaffMember {
  id: string
  username: string
  role: StaffRole
  display_code: string
  is_active: boolean
  created_at: string
}

export interface StaffCreatePayload {
  username: string
  password: string
  role: StaffRole
  display_code?: string
}

// ── Proctor / admin types ─────────────────────────────────────────────────────
export interface Site {
  id: string
  site_code: string
  site_name: string
  created_at: string
}

export interface Batch {
  id: string
  site_id: string
  site_code: string
  batch_code: string
  clinic_date: string
  layer: 1 | 2
  timing_mode: 'PER_TASK' | 'BLOCK'
  created_at: string
}

export interface CheckInPayload {
  batch_id: string
  consent_given: true
  device_category: 'DESKTOP' | 'MOBILE' | 'TABLET'
  os_family: string
  browser_family: string
  user_agent_raw: string
}

export interface AssignmentSuggestion {
  participant_id: string
  suggested_group: GroupAssignment
  stratum: string
  current_counts: Record<string, number>
}

export interface CheckInResponse {
  participant_id: string
  participant_code: string
}

export interface AssignmentPayload {
  group: GroupAssignment
  method: 'SUGGESTED_ACCEPTED' | 'MANUAL_OVERRIDE'
  override_reason?: string
}

export interface WarmupOverridePayload {
  score: number
}

export interface DeviationPayload {
  batch_id: string
  participant_id?: string
  description: string
}

export interface Layer2LogPayload {
  participant_id: string
  prompt_log_id: string
  model_name_shown: string
  prompt_count: number
  time_in_tool_minutes: number
  copy_similarity_note?: string
}

export interface ParticipantMonitorRow {
  participant_id: string
  participant_code: string
  status: ParticipantStatus
  current_step: string
  last_sync_age_seconds: number
  infraction_count: number
  warmup_score: number | null
  warmup_score_overridden: boolean
  group_assignment: GroupAssignment | null
}

// ── Rater types ───────────────────────────────────────────────────────────────
export interface RaterResponse {
  response_id: string
  session_number: SessionNumber
  task_code: string
  objective_question: string
  objective_answer: string
  text_justification: string
}

export interface RaterScorePayload {
  response_id: string
  correctness: 0 | 1 | 2
  justification_quality: 0 | 1 | 2
  independence: 0 | 1 | 2
}

// ── Export types ──────────────────────────────────────────────────────────────
export interface ExportMeta {
  name: string
  label: string
  row_count: number
}

// ── Scale item (static seed) ──────────────────────────────────────────────────
export interface ScaleItem {
  item_code: string
  text: string
  session: SessionNumber
  group: 'ALL' | 'AI_ASSISTED'
}
