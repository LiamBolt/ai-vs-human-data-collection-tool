import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { useSessionStore } from '@/store/session'

function setSession(n: 1 | 2) {
  useSessionStore.setState({
    participant_code: 'TEST',
    current_session: n,
    session2_enforcement_active: n === 2,
    telemetry_buffer: [],
    timer_marks: {},
  })
}

// The paste handler is a document-level listener that only acts on elements
// inside a [data-task-field] wrapper, so the fixture mirrors that structure.
function makeTaskField(id: string) {
  const wrap = document.createElement('div')
  wrap.setAttribute('data-task-field', '')
  const input = document.createElement('input')
  input.id = id
  wrap.appendChild(input)
  document.body.appendChild(wrap)
  return { wrap, input }
}

describe('useTelemetry — paste handling', () => {
  beforeEach(() => setSession(1))

  it('allows paste in Session 1 and records a PASTE event', () => {
    renderHook(() => useTelemetry('A1'))
    const { wrap, input } = makeTaskField('A1-objective')

    const evt = new Event('paste', { bubbles: true, cancelable: true })
    act(() => {
      input.dispatchEvent(evt)
    })

    expect(evt.defaultPrevented).toBe(false)
    const buf = useSessionStore.getState().telemetry_buffer
    expect(buf.filter((e) => e.event_type === 'PASTE')).toHaveLength(1)
    expect(buf.filter((e) => e.event_type === 'PASTE_BLOCKED')).toHaveLength(0)

    document.body.removeChild(wrap)
  })

  it('blocks paste in Session 2 and records PASTE_BLOCKED + INFRACTION', () => {
    setSession(2)
    renderHook(() => useTelemetry('A3'))
    const { wrap, input } = makeTaskField('A3-objective')

    const evt = new Event('paste', { bubbles: true, cancelable: true })
    act(() => {
      input.dispatchEvent(evt)
    })

    expect(evt.defaultPrevented).toBe(true)
    const buf = useSessionStore.getState().telemetry_buffer
    expect(buf.filter((e) => e.event_type === 'PASTE_BLOCKED').length).toBeGreaterThanOrEqual(1)
    expect(buf.filter((e) => e.event_type === 'INFRACTION').length).toBeGreaterThanOrEqual(1)

    document.body.removeChild(wrap)
  })

  it('ignores paste events outside a task field', () => {
    renderHook(() => useTelemetry('A1'))
    const stray = document.createElement('input')
    document.body.appendChild(stray)

    const evt = new Event('paste', { bubbles: true, cancelable: true })
    act(() => {
      stray.dispatchEvent(evt)
    })

    const buf = useSessionStore.getState().telemetry_buffer
    expect(buf.filter((e) => e.event_type === 'PASTE')).toHaveLength(0)

    document.body.removeChild(stray)
  })
})

describe('useTelemetry — split timer computation', () => {
  beforeEach(() => setSession(1))

  it('computes objective, justification and total durations from marks', () => {
    let now = 1000
    const spy = vi.spyOn(performance, 'now').mockImplementation(() => now)

    const { result } = renderHook(() => useTelemetry('A1'))

    act(() => {
      result.current.recordStart()
    })
    now = 5000
    act(() => {
      result.current.recordFirstAnswer()
    })
    now = 15000
    act(() => {
      result.current.recordEnd()
    })

    const d = result.current.getTimerDurations()
    expect(d.duration_objective_ms).toBe(4000) // first answer - start
    expect(d.duration_justification_ms).toBe(10000) // end - first answer
    expect(d.duration_total_ms).toBe(14000) // end - start

    spy.mockRestore()
  })

  it('only records the first answer timestamp once', () => {
    let now = 1000
    const spy = vi.spyOn(performance, 'now').mockImplementation(() => now)

    const { result } = renderHook(() => useTelemetry('A1'))
    act(() => {
      result.current.recordStart()
    })
    now = 3000
    act(() => {
      result.current.recordFirstAnswer()
    })
    now = 9000
    act(() => {
      result.current.recordFirstAnswer() // should be ignored
    })
    now = 12000
    act(() => {
      result.current.recordEnd()
    })

    const d = result.current.getTimerDurations()
    expect(d.duration_objective_ms).toBe(2000) // 3000 - 1000, not 9000

    spy.mockRestore()
  })
})
