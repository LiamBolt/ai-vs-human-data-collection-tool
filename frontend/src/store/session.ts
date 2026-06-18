import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { participantStorageKey, debounce } from '@/lib/utils'
import type {
  ParticipantStatus,
  GroupAssignment,
  SessionNumber,
  TelemetryEvent,
  TelemetryEventType,
  HintTaskState,
  HintTaskProgress,
  TimerMarks,
} from '@/types'

interface SessionStore {
  participant_code: string | null
  status: ParticipantStatus | null
  current_step: string | null
  group_assignment: GroupAssignment | null
  current_session: SessionNumber
  draft_answers: Record<string, unknown>
  telemetry_buffer: TelemetryEvent[]
  hint_state: Record<string, HintTaskState>
  timer_marks: Record<string, TimerMarks>
  sync_status: 'synced' | 'syncing' | 'offline'
  break_ends_at: string | null
  session2_enforcement_active: boolean

  // Actions
  setParticipant: (
    code: string,
    status: ParticipantStatus,
    step: string,
    group: GroupAssignment | null,
    session: SessionNumber,
    breakEndsAt: string | null,
    draftAnswers: Record<string, unknown>,
  ) => void
  setStatus: (status: ParticipantStatus) => void
  setStep: (step: string) => void
  setGroupAssignment: (group: GroupAssignment) => void
  setCurrentSession: (session: SessionNumber) => void
  setDraftAnswer: (namespace: string, field: string, value: unknown) => void
  setDraftAnswers: (answers: Record<string, unknown>) => void
  getDraftForTask: (taskCode: string) => Record<string, unknown>
  pushTelemetry: (
    type: TelemetryEventType,
    taskCode: string | null,
    metadata?: Record<string, unknown>,
  ) => TelemetryEvent
  markTelemetrySent: (ids: string[]) => void
  setSyncStatus: (status: 'synced' | 'syncing' | 'offline') => void
  setBreakEndsAt: (endsAt: string | null) => void
  setSession2Enforcement: (active: boolean) => void
  updateHintState: (taskCode: string, update: Partial<HintTaskState>) => void
  restoreHintState: (progress: Record<string, HintTaskProgress>) => void
  setTimerMark: (taskCode: string, marks: Partial<TimerMarks>) => void
  clearParticipant: () => void
}

const INITIAL_STATE = {
  participant_code: null as string | null,
  status: null as ParticipantStatus | null,
  current_step: null as string | null,
  group_assignment: null as GroupAssignment | null,
  current_session: 1 as SessionNumber,
  draft_answers: {} as Record<string, unknown>,
  telemetry_buffer: [] as TelemetryEvent[],
  hint_state: {} as Record<string, HintTaskState>,
  timer_marks: {} as Record<string, TimerMarks>,
  sync_status: 'synced' as 'synced' | 'syncing' | 'offline',
  break_ends_at: null as string | null,
  session2_enforcement_active: false,
}

export const useSessionStore = create<SessionStore>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_STATE,

    setParticipant: (code, status, step, group, session, breakEndsAt, draftAnswers) =>
      set({
        participant_code: code,
        status,
        current_step: step,
        group_assignment: group,
        current_session: session,
        break_ends_at: breakEndsAt,
        draft_answers: draftAnswers,
      }),

    setStatus: (status) => set({ status }),

    setStep: (step) => set({ current_step: step }),

    setGroupAssignment: (group) => set({ group_assignment: group }),

    setCurrentSession: (session) => set({ current_session: session }),

    setDraftAnswer: (namespace, field, value) =>
      set((s) => ({
        draft_answers: { ...s.draft_answers, [`${namespace}.${field}`]: value },
      })),

    setDraftAnswers: (answers) =>
      set((s) => ({ draft_answers: { ...s.draft_answers, ...answers } })),

    getDraftForTask: (taskCode) => {
      const prefix = `${taskCode}.`
      const all = get().draft_answers
      const result: Record<string, unknown> = {}
      for (const key of Object.keys(all)) {
        if (key.startsWith(prefix)) {
          result[key.slice(prefix.length)] = all[key]
        }
      }
      return result
    },

    pushTelemetry: (type, taskCode, metadata = {}) => {
      const event: TelemetryEvent = {
        client_event_id: uuidv4(),
        event_type: type,
        task_code: taskCode,
        session_number: get().current_session,
        client_timestamp_ms: Date.now(),
        event_metadata: metadata,
      }
      set((s) => ({ telemetry_buffer: [...s.telemetry_buffer, event] }))
      return event
    },

    markTelemetrySent: (ids) =>
      set((s) => ({
        telemetry_buffer: s.telemetry_buffer.filter(
          (e) => !ids.includes(e.client_event_id),
        ),
      })),

    setSyncStatus: (status) => set({ sync_status: status }),

    setBreakEndsAt: (endsAt) => set({ break_ends_at: endsAt }),

    setSession2Enforcement: (active) => set({ session2_enforcement_active: active }),

    updateHintState: (taskCode, update) =>
      set((s) => {
        const existing = s.hint_state[taskCode] ?? {
          unlocked_level: 0,
          hints: {},
          copied: false,
          request_count: 0,
          reveal_timestamps: {},
        }
        return {
          hint_state: {
            ...s.hint_state,
            [taskCode]: { ...existing, ...update },
          },
        }
      }),

    restoreHintState: (progress) =>
      set({
        hint_state: Object.fromEntries(
          Object.entries(progress).map(([task, p]) => [
            task,
            {
              unlocked_level: p.unlocked_level,
              hints: p.hints,
              copied: false,
              request_count: p.request_count,
              reveal_timestamps: {},
            },
          ]),
        ),
      }),

    setTimerMark: (taskCode, marks) =>
      set((s) => {
        const existing = s.timer_marks[taskCode] ?? {
          t_start: 0,
          t_select: null,
          t_end: null,
        }
        return {
          timer_marks: {
            ...s.timer_marks,
            [taskCode]: { ...existing, ...marks },
          },
        }
      }),

    clearParticipant: () => set(INITIAL_STATE),
  })),
)

// ── Persist participant state to localStorage (debounced 500ms) ───────────────
const persistState = debounce((code: string, state: Omit<SessionStore, keyof { [K in keyof SessionStore as SessionStore[K] extends (...args: unknown[]) => unknown ? K : never]: unknown }>) => {
  try {
    const toSave = {
      status: state.status,
      current_step: state.current_step,
      group_assignment: state.group_assignment,
      current_session: state.current_session,
      draft_answers: state.draft_answers,
      hint_state: state.hint_state,
      timer_marks: state.timer_marks,
      break_ends_at: state.break_ends_at,
      session2_enforcement_active: state.session2_enforcement_active,
    }
    localStorage.setItem(participantStorageKey(code), JSON.stringify(toSave))
  } catch {
    // Storage quota or access denied — silently ignore
  }
}, 500)

useSessionStore.subscribe(
  (state) => state.participant_code,
  () => {
    // When participant_code changes, trigger a save of the full state
    const state = useSessionStore.getState()
    if (state.participant_code) {
      persistState(state.participant_code, state as never)
    }
  },
)

// Persist on any meaningful state change
useSessionStore.subscribe(
  (state) => ({
    status: state.status,
    current_step: state.current_step,
    draft_answers: state.draft_answers,
    hint_state: state.hint_state,
    timer_marks: state.timer_marks,
  }),
  () => {
    const state = useSessionStore.getState()
    if (state.participant_code) {
      persistState(state.participant_code, state as never)
    }
  },
)
