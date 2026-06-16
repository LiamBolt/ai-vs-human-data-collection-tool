import { ApiError } from './queryClient'
import type {
  SessionResumeResponse,
  StateSyncPayload,
  Form0Payload,
  Form0Response,
  TaskSubmitPayload,
  TaskSubmitResponse,
  HintRequestPayload,
  HintResponse,
  BreakStartResponse,
  BreakStatusResponse,
  ScaleSubmitPayload,
  TransferPromptPayload,
  LoginCredentials,
  LoginResponse,
  Site,
  Batch,
  CheckInPayload,
  CheckInResponse,
  AssignmentPayload,
  AssignmentSuggestion,
  WarmupOverridePayload,
  DeviationPayload,
  Layer2LogPayload,
  ParticipantMonitorRow,
  RaterResponse,
  RaterScorePayload,
  ExportMeta,
  StaffMember,
  StaffCreatePayload,
} from '@/types'

// Same-origin '/api/v1' for local/compose (nginx proxies it). For split hosting
// (e.g. Render), set VITE_API_BASE_URL at build time to the backend's absolute URL,
// e.g. https://aivb-backend.onrender.com/api/v1.
const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

// Retrieve the stored JWT for authenticated requests
function getAuthHeader(): Record<string, string> {
  const token = sessionStorage.getItem('staff_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  authenticated = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authenticated ? getAuthHeader() : {}),
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let code = 'UNKNOWN_ERROR'
    let message = `HTTP ${res.status}`
    let details: unknown
    try {
      const json = (await res.json()) as { error?: { code?: string; message?: string; details?: unknown } }
      code = json.error?.code ?? code
      message = json.error?.message ?? message
      details = json.error?.details
    } catch {
      // Body may not be JSON
    }
    throw new ApiError(res.status, code, message, details)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Participant flow ───────────────────────────────────────────────────────────
export const resumeSession = (participantCode: string) =>
  request<SessionResumeResponse>('POST', '/session/resume', { participant_code: participantCode })

export const syncState = (payload: StateSyncPayload) =>
  request<void>('PATCH', '/session/state', payload)

export const submitForm0 = (payload: Form0Payload) =>
  request<Form0Response>('POST', '/form0/submit', payload)

export const submitTask = (taskCode: string, payload: TaskSubmitPayload) =>
  request<TaskSubmitResponse>('POST', `/tasks/${taskCode}/submit`, payload)

export const requestHint = (payload: HintRequestPayload) =>
  request<HintResponse>('POST', '/hints/request', payload)

export const startBreak = (participantCode: string) =>
  request<BreakStartResponse>('POST', '/break/start', { participant_code: participantCode })

export const getBreakStatus = (participantCode: string) =>
  request<BreakStatusResponse>('GET', `/break/status?participant_code=${encodeURIComponent(participantCode)}`)

export const completeBreak = (participantCode: string) =>
  request<void>('POST', '/break/complete', { participant_code: participantCode })

export const submitScales = (payload: ScaleSubmitPayload) =>
  request<void>('POST', '/scales/submit', payload)

export const submitTransferPrompt = (payload: TransferPromptPayload) =>
  request<void>('POST', '/session2/transfer-prompt', payload)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (credentials: LoginCredentials) =>
  request<LoginResponse>('POST', '/auth/login', credentials)

// ── Staff management (ADMIN only) ──────────────────────────────────────────────
export const getStaff = () =>
  request<StaffMember[]>('GET', '/auth/staff', undefined, true)

export const createStaff = (payload: StaffCreatePayload) =>
  request<StaffMember>('POST', '/auth/staff', payload, true)

export const setStaffActive = (staffId: string, isActive: boolean) =>
  request<StaffMember>('PATCH', `/auth/staff/${staffId}`, { is_active: isActive }, true)

// ── Proctor / admin ───────────────────────────────────────────────────────────
export const getSites = () =>
  request<Site[]>('GET', '/sites', undefined, true)

export const createSite = (payload: { site_code: string; site_name: string }) =>
  request<Site>('POST', '/sites', payload, true)

export const getBatches = () =>
  request<Batch[]>('GET', '/batches', undefined, true)

export const createBatch = (payload: {
  site_id: string
  clinic_date: string
  layer: 1 | 2
  timing_mode: 'PER_TASK' | 'BLOCK'
}) => request<Batch>('POST', '/batches', payload, true)

export const checkInParticipant = (payload: CheckInPayload) =>
  request<CheckInResponse>('POST', '/participants/check-in', payload, true)

// Stratified suggestion is only available after the participant submits Form 0;
// the backend returns 409 (FORM0_INCOMPLETE) until then.
export const getAssignmentSuggestion = (participantId: string) =>
  request<AssignmentSuggestion>('GET', `/participants/${participantId}/assignment-suggestion`, undefined, true)

export const setAssignment = (participantId: string, payload: AssignmentPayload) =>
  request<AssignmentSuggestion>('POST', `/participants/${participantId}/assignment`, payload, true)

export const overrideWarmupScore = (participantId: string, payload: WarmupOverridePayload) =>
  request<void>('PATCH', `/participants/${participantId}/warmup-override`, payload, true)

export const createDeviation = (payload: DeviationPayload) =>
  request<void>('POST', '/deviations', payload, true)

export const createLayer2Log = (payload: Layer2LogPayload) =>
  request<void>('POST', '/layer2-logs', payload, true)

export const getMonitor = (batchId: string) =>
  request<ParticipantMonitorRow[]>('GET', `/batches/${batchId}/monitor`, undefined, true)

export const getExportMeta = () =>
  request<ExportMeta[]>('GET', '/exports/meta', undefined, true)

/**
 * Download a CSV export. The export endpoints require a staff JWT, so we cannot
 * use a plain `<a href>` (the browser would navigate without the Authorization
 * header → 401 UNAUTHORIZED). Instead we fetch with the bearer token, then save
 * the response as a Blob via a temporary object URL.
 */
export async function downloadExport(name: string): Promise<void> {
  const res = await fetch(`${BASE}/exports/${name}.csv`, {
    method: 'GET',
    headers: { ...getAuthHeader() },
  })

  if (!res.ok) {
    let code = 'UNKNOWN_ERROR'
    let message = `HTTP ${res.status}`
    try {
      const json = (await res.json()) as { error?: { code?: string; message?: string } }
      code = json.error?.code ?? code
      message = json.error?.message ?? message
    } catch {
      // Body may not be JSON
    }
    throw new ApiError(res.status, code, message)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// ── Rater ─────────────────────────────────────────────────────────────────────
export const getRaterQueue = () =>
  request<RaterResponse[]>('GET', '/rater/queue', undefined, true)

export const submitRaterScore = (payload: RaterScorePayload) =>
  request<void>('POST', '/rater/scores', payload, true)
