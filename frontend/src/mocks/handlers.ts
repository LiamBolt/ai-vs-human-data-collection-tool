import { http, HttpResponse } from 'msw'
import { v4 as uuidv4 } from 'uuid'

// Verbatim hint texts from MEGA_PROMPT Module D4
const HINTS: Record<string, Record<string, string>> = {
  A1: {
    '1': 'Multiply price×quantity then add.',
    '2': '3×2000=____; 2×3500=____; 1×4000=____; add.',
    '3': '3×2000=6000; 2×3500=7000; 1×4000=4000; total 17000; verify by re-add/estimate.',
  },
  A2: {
    '1': '(new−old)/old×100.',
    '2': '55−30=____; ____/30=____; ×100.',
    '3': '25/30≈0.833; 83.3%; verify 30×0.83≈25.',
  },
  B1: {
    '1': 'Check logical form A→B, ¬B, therefore ¬A.',
    '2': 'Let A=rains B=floods; is it valid?',
    '3': 'Valid (modus tollens) under rule; justify assumption.',
  },
  B2: {
    '1': 'Add travel time to departure.',
    '2': '08:00 + 1h = 09:00; +30m = 09:30.',
    '3': 'Expected 09:30, not 10:00; verify via minutes.',
  },
  C1: {
    '1': 'Simple interest P×R×T, convert months.',
    '2': 'T=6 months=0.5 years; interest = 1,000,000×0.10×0.5=____.',
    '3': 'Interest=50,000; verify 10%/yr=100,000 then half year.',
  },
  C2: {
    '1': 'Compute daily total and weekly+extra days.',
    '2': 'Daily 10×5000=____; Weekly 30000 + 3×5000=____.',
    '3': '50,000 vs 45,000; weekly cheaper by 5,000; verify subtract.',
  },
}

let mockParticipantCode = 'UCU_MUKONO-20240101_01-0001'
let mockBatchId = 'batch-mock-id'
let mockSiteId = 'site-mock-id'
let currentGroupAssignment: string | null = null
let currentStep = 'form0'
let currentStatus = 'CHECKED_IN'

const BREAK_DURATION_S = 30 // Short for dev

let breakEndsAt: string | null = null

// In-memory staff registry for dev (seeded with the bootstrap admin)
interface MockStaff {
  id: string
  username: string
  role: 'PROCTOR' | 'RATER' | 'ADMIN'
  display_code: string
  is_active: boolean
  created_at: string
}
const staffStore: MockStaff[] = [
  {
    id: uuidv4(),
    username: 'admin',
    role: 'ADMIN',
    display_code: 'ADMIN-01',
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

export const handlers = [
  // ── Health ──────────────────────────────────────────────────────────────────
  http.get('/api/v1/health', () =>
    HttpResponse.json({ status: 'ok', db: 'ok', version: '1.0.0' }),
  ),

  // ── Session resume / rehydration ─────────────────────────────────────────────
  http.post('/api/v1/session/resume', async ({ request }) => {
    const body = (await request.json()) as { participant_code: string }
    const code = body.participant_code

    if (!code || code.length < 3) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Participant not found' } },
        { status: 404 },
      )
    }

    mockParticipantCode = code

    return HttpResponse.json({
      participant_code: code,
      status: currentStatus,
      current_step: currentStep,
      group_assignment: currentGroupAssignment,
      current_session: currentStep.startsWith('s2') ? 2 : 1,
      draft_responses: {},
      break_ends_at: breakEndsAt,
      current_task: null,
    })
  }),

  // ── State sync ───────────────────────────────────────────────────────────────
  http.patch('/api/v1/session/state', () => new HttpResponse(null, { status: 204 })),

  // ── Form 0 ───────────────────────────────────────────────────────────────────
  http.post('/api/v1/form0/submit', async () => {
    currentStatus = 'FORM0'
    currentStep = 'waiting_assignment'
    return HttpResponse.json({
      status: 'FORM0',
      warmup_auto_score: 3,
      assignment_pending: true,
    })
  }),

  // ── Task submit ──────────────────────────────────────────────────────────────
  http.post('/api/v1/tasks/:taskCode/submit', ({ params }) => {
    const { taskCode } = params as { taskCode: string }
    const s1 = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const s2 = ['A3', 'A4', 'B3', 'B4']

    const idx1 = s1.indexOf(taskCode)
    const idx2 = s2.indexOf(taskCode)

    let nextStep = 'complete'
    if (idx1 !== -1) {
      nextStep = idx1 < s1.length - 1 ? `s1_task_${s1[idx1 + 1]}` : 's1_scales'
      currentStatus = 'SESSION1'
    } else if (idx2 !== -1) {
      nextStep = idx2 < s2.length - 1 ? `s2_task_${s2[idx2 + 1]}` : 's2_transfer'
      currentStatus = 'SESSION2'
    }

    currentStep = nextStep
    return HttpResponse.json({ next_step: nextStep, session_complete: nextStep.includes('scales') })
  }),

  // ── Hints ────────────────────────────────────────────────────────────────────
  http.post('/api/v1/hints/request', async ({ request }) => {
    const body = (await request.json()) as { task_code: string; level: number }
    const hintText = HINTS[body.task_code]?.[String(body.level)] ?? 'Hint not available.'

    // Simulate 600ms latency for skeleton shimmer
    await new Promise((r) => setTimeout(r, 600))

    return HttpResponse.json({
      hint_text: hintText,
      level: body.level,
      task_code: body.task_code,
    })
  }),

  // ── Break ────────────────────────────────────────────────────────────────────
  http.post('/api/v1/break/start', () => {
    breakEndsAt = new Date(Date.now() + BREAK_DURATION_S * 1000).toISOString()
    currentStatus = 'BREAK'
    currentStep = 'break'
    return HttpResponse.json({ break_ends_at: breakEndsAt })
  }),

  http.get('/api/v1/break/status', () => {
    const remaining = breakEndsAt
      ? Math.max(0, (new Date(breakEndsAt).getTime() - Date.now()) / 1000)
      : BREAK_DURATION_S
    return HttpResponse.json({
      remaining_seconds: remaining,
      break_ends_at: breakEndsAt ?? new Date(Date.now() + BREAK_DURATION_S * 1000).toISOString(),
    })
  }),

  http.post('/api/v1/break/complete', () => {
    currentStatus = 'SESSION2'
    currentStep = 's2_intro'
    return new HttpResponse(null, { status: 204 })
  }),

  // ── Scales ───────────────────────────────────────────────────────────────────
  http.post('/api/v1/scales/submit', async ({ request }) => {
    const body = (await request.json()) as { session_number: number }
    if (body.session_number === 1) {
      currentStatus = 'BREAK'
      currentStep = 'break'
    } else {
      currentStatus = 'COMPLETED'
      currentStep = 'completed'
    }
    return new HttpResponse(null, { status: 201 })
  }),

  // ── Transfer prompt ──────────────────────────────────────────────────────────
  http.post('/api/v1/session2/transfer-prompt', () => {
    currentStatus = 'SCALES_S2'
    currentStep = 'scales_s2'
    return new HttpResponse(null, { status: 201 })
  }),

  // ── Auth ─────────────────────────────────────────────────────────────────────
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string }

    if (body.username === 'admin' && body.password === 'changeme-admin') {
      return HttpResponse.json({
        access_token: 'mock-admin-jwt',
        token_type: 'bearer',
        role: 'ADMIN',
        display_code: 'ADMIN-01',
      })
    }
    if (body.username === 'proctor' && body.password === 'proctor123') {
      return HttpResponse.json({
        access_token: 'mock-proctor-jwt',
        token_type: 'bearer',
        role: 'PROCTOR',
        display_code: 'P-01',
      })
    }
    if (body.username === 'rater' && body.password === 'rater123') {
      return HttpResponse.json({
        access_token: 'mock-rater-jwt',
        token_type: 'bearer',
        role: 'RATER',
        display_code: 'R-01',
      })
    }

    return HttpResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } },
      { status: 401 },
    )
  }),

  // ── Staff management (ADMIN only) ────────────────────────────────────────────
  http.get('/api/v1/auth/staff', () => HttpResponse.json(staffStore)),

  http.post('/api/v1/auth/staff', async ({ request }) => {
    const body = (await request.json()) as {
      username: string
      password: string
      role: 'PROCTOR' | 'RATER' | 'ADMIN'
      display_code?: string
    }
    if (staffStore.some((s) => s.username === body.username)) {
      return HttpResponse.json(
        { error: { code: 'USERNAME_TAKEN', message: 'That username is already taken.' } },
        { status: 409 },
      )
    }
    const count = staffStore.filter((s) => s.role === body.role).length
    const member = {
      id: uuidv4(),
      username: body.username,
      role: body.role,
      display_code: body.display_code || `${body.role}-${String(count + 1).padStart(2, '0')}`,
      is_active: true,
      created_at: new Date().toISOString(),
    }
    staffStore.push(member)
    return HttpResponse.json(member, { status: 201 })
  }),

  http.patch('/api/v1/auth/staff/:staffId', async ({ params, request }) => {
    const body = (await request.json()) as { is_active: boolean }
    const member = staffStore.find((s) => s.id === params.staffId)
    if (!member) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Staff account not found.' } },
        { status: 404 },
      )
    }
    member.is_active = body.is_active
    return HttpResponse.json(member)
  }),

  // ── Sites ────────────────────────────────────────────────────────────────────
  http.get('/api/v1/sites', () =>
    HttpResponse.json([
      { id: mockSiteId, site_code: 'UCU_MUKONO', site_name: 'UCU Mukono', created_at: new Date().toISOString() },
    ]),
  ),

  http.post('/api/v1/sites', async ({ request }) => {
    const body = (await request.json()) as { site_code: string; site_name: string }
    return HttpResponse.json({
      id: uuidv4(),
      site_code: body.site_code,
      site_name: body.site_name,
      created_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  // ── Batches ───────────────────────────────────────────────────────────────────
  http.get('/api/v1/batches', () =>
    HttpResponse.json([
      {
        id: mockBatchId,
        site_id: mockSiteId,
        site_code: 'UCU_MUKONO',
        batch_code: '20240101_UCU_MUKONO_BATCH01',
        clinic_date: '2024-01-01',
        layer: 1,
        timing_mode: 'PER_TASK',
        created_at: new Date().toISOString(),
      },
    ]),
  ),

  http.post('/api/v1/batches', async ({ request }) => {
    const body = (await request.json()) as object
    return HttpResponse.json(
      { id: uuidv4(), ...body, batch_code: '20240102_UCU_MUKONO_BATCH02', created_at: new Date().toISOString() },
      { status: 201 },
    )
  }),

  // ── Check-in ─────────────────────────────────────────────────────────────────
  http.post('/api/v1/participants/check-in', () => {
    const newId = uuidv4()
    const newCode = 'UCU_MUKONO-01-0002'
    return HttpResponse.json(
      { participant_id: newId, participant_code: newCode },
      { status: 201 },
    )
  }),

  // ── Assignment suggestion (available after Form 0) ───────────────────────────
  http.get('/api/v1/participants/:id/assignment-suggestion', ({ params }) => {
    const { id } = params as { id: string }
    return HttpResponse.json({
      participant_id: id,
      suggested_group: 'AI_ASSISTED',
      stratum: 'DEGREE/HIGH',
      current_counts: {
        'SECONDARY/LOW / CONTROL': 2,
        'SECONDARY/LOW / AI_ASSISTED': 2,
        'DEGREE/HIGH / CONTROL': 3,
        'DEGREE/HIGH / AI_ASSISTED': 2,
      },
    })
  }),

  // ── Assignment ───────────────────────────────────────────────────────────────
  http.post('/api/v1/participants/:id/assignment', async ({ request }) => {
    const body = (await request.json()) as { group: string }
    currentGroupAssignment = body.group
    return HttpResponse.json({
      participant_id: uuidv4(),
      suggested_group: body.group,
      stratum: 'DEGREE_HIGH',
      current_counts: {},
    })
  }),

  // ── Warmup override ──────────────────────────────────────────────────────────
  http.patch('/api/v1/participants/:id/warmup-override', () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // ── Deviations ───────────────────────────────────────────────────────────────
  http.post('/api/v1/deviations', () => new HttpResponse(null, { status: 201 })),

  // ── Layer 2 logs ─────────────────────────────────────────────────────────────
  http.post('/api/v1/layer2-logs', () => new HttpResponse(null, { status: 201 })),

  // ── Monitor ──────────────────────────────────────────────────────────────────
  http.get('/api/v1/batches/:batchId/monitor', () =>
    HttpResponse.json([
      {
        participant_id: uuidv4(),
        participant_code: mockParticipantCode,
        status: currentStatus,
        current_step: currentStep,
        last_sync_age_seconds: 5,
        infraction_count: 0,
        warmup_score: 3,
        warmup_score_overridden: false,
        group_assignment: currentGroupAssignment,
      },
    ]),
  ),

  // ── Exports ──────────────────────────────────────────────────────────────────
  http.get('/api/v1/exports/meta', () =>
    HttpResponse.json([
      { name: 'participants', label: 'Participants', row_count: 12 },
      { name: 'task_responses', label: 'Task responses', row_count: 107 },
      { name: 'telemetry_events', label: 'Telemetry events', row_count: 843 },
      { name: 'hint_events', label: 'Hint events', row_count: 34 },
      { name: 'scale_responses', label: 'Scale responses', row_count: 132 },
      { name: 'rater_scores', label: 'Rater scores', row_count: 89 },
      { name: 'session_meta', label: 'Session metadata', row_count: 24 },
      { name: 'deviation_logs', label: 'Deviation logs', row_count: 2 },
      { name: 'layer2_logs', label: 'Layer 2 logs', row_count: 0 },
      { name: 'data_dictionary', label: 'Data dictionary', row_count: 67 },
    ]),
  ),

  http.get('/api/v1/exports/:name.csv', ({ params }) => {
    const { name } = params as { name: string }
    return new HttpResponse(`participant_code,session_number\n${mockParticipantCode},1\n`, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${name}.csv"`,
      },
    })
  }),

  // ── Rater queue ──────────────────────────────────────────────────────────────
  http.get('/api/v1/rater/queue', () =>
    HttpResponse.json([
      {
        response_id: uuidv4(),
        session_number: 1,
        task_code: 'A1',
        objective_question: 'Prices: Bread 2,000 UGX, Milk 3,500 UGX, Sugar 4,000 UGX. A customer buys 3 bread, 2 milk, 1 sugar. What is the total cost?',
        objective_answer: '17000',
        text_justification: 'I multiplied each item by its quantity and added them up. 3×2000=6000, 2×3500=7000, 1×4000=4000. Total = 6000+7000+4000 = 17,000 UGX.',
      },
      {
        response_id: uuidv4(),
        session_number: 1,
        task_code: 'B1',
        objective_question: 'If it rains, the road floods. The road did not flood. Therefore it did not rain. Is this valid? Yes or No.',
        objective_answer: 'YES',
        text_justification: 'This is modus tollens logic. If rain implies flooding, then no flooding means no rain. The argument is valid.',
      },
    ]),
  ),

  http.post('/api/v1/rater/scores', () => new HttpResponse(null, { status: 201 })),
]
