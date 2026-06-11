import { useEffect, useRef, useCallback, useState } from 'react'
import { useSessionStore } from '@/store/session'

interface TelemetryHook {
  recordStart: () => void
  recordFirstAnswer: () => void
  recordEnd: () => void
  getTimerDurations: () => {
    duration_objective_ms: number
    duration_justification_ms: number
    duration_total_ms: number
  }
  onObjectiveChange: (fieldId: string, previousValue: string, newValue: string) => void
  answerChangeCount: number
  pasteBlockedMessage: string | null
  clearPasteBlockedMessage: () => void
  showTabModal: boolean
  dismissTabModal: () => void
}

export function useTelemetry(taskCode: string): TelemetryHook {
  const pushTelemetry = useSessionStore((s) => s.pushTelemetry)
  const session = useSessionStore((s) => s.current_session)
  const session2Active = useSessionStore((s) => s.session2_enforcement_active)

  const answerChangeCountRef = useRef(0)
  const [answerChangeCount, setAnswerChangeCount] = useState(0)
  const [pasteBlockedMessage, setPasteBlockedMessage] = useState<string | null>(null)
  const [showTabModal, setShowTabModal] = useState(false)

  // Split timer refs
  const tStartRef = useRef<number | null>(null)
  const tSelectRef = useRef<number | null>(null)
  const tEndRef = useRef<number | null>(null)
  const tabHiddenAtRef = useRef<number | null>(null)

  const recordStart = useCallback(() => {
    tStartRef.current = performance.now()
    pushTelemetry('SESSION_START', taskCode)
  }, [taskCode, pushTelemetry])

  const recordFirstAnswer = useCallback(() => {
    if (tSelectRef.current === null) {
      tSelectRef.current = performance.now()
    }
  }, [])

  const recordEnd = useCallback(() => {
    tEndRef.current = performance.now()
  }, [])

  const getTimerDurations = useCallback(() => {
    const now = performance.now()
    const start = tStartRef.current ?? now
    const select = tSelectRef.current ?? now
    const end = tEndRef.current ?? now

    return {
      duration_objective_ms: Math.round(select - start),
      duration_justification_ms: Math.round(end - select),
      duration_total_ms: Math.round(end - start),
    }
  }, [])

  const onObjectiveChange = useCallback(
    (fieldId: string, previousValue: string, newValue: string) => {
      answerChangeCountRef.current += 1
      setAnswerChangeCount(answerChangeCountRef.current)
      pushTelemetry('ANSWER_REVISION', taskCode, {
        field_id: fieldId,
        previous_value: previousValue,
        new_value: newValue,
        t_offset_ms: Math.round(performance.now() - (tStartRef.current ?? 0)),
      })
      recordFirstAnswer()
    },
    [taskCode, pushTelemetry, recordFirstAnswer],
  )

  // Visibility change: TAB_BLUR on hide, TAB_FOCUS on return
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabHiddenAtRef.current = performance.now()
        pushTelemetry('TAB_BLUR', taskCode, {})
      } else {
        const awayMs =
          tabHiddenAtRef.current !== null
            ? Math.round(performance.now() - tabHiddenAtRef.current)
            : 0
        tabHiddenAtRef.current = null
        pushTelemetry('TAB_FOCUS', taskCode, { away_duration_ms: awayMs })

        if (session2Active && awayMs > 0) {
          setShowTabModal(true)
          pushTelemetry('INFRACTION', taskCode, {
            kind: 'tab_switch_s2',
            detail: `away_ms=${awayMs}`,
          })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [taskCode, pushTelemetry, session2Active])

  // Window blur/focus fallback
  useEffect(() => {
    const handleBlur = () => {
      if (!document.hidden) {
        tabHiddenAtRef.current = performance.now()
        pushTelemetry('TAB_BLUR', taskCode, {})
      }
    }
    const handleFocus = () => {
      if (!document.hidden && tabHiddenAtRef.current !== null) {
        const awayMs = Math.round(performance.now() - tabHiddenAtRef.current)
        tabHiddenAtRef.current = null
        pushTelemetry('TAB_FOCUS', taskCode, { away_duration_ms: awayMs })

        if (session2Active && awayMs > 0) {
          setShowTabModal(true)
          pushTelemetry('INFRACTION', taskCode, {
            kind: 'tab_switch_s2',
            detail: `away_ms=${awayMs}`,
          })
        }
      }
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [taskCode, pushTelemetry, session2Active])

  // Paste handler: allow in S1, block in S2
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      // Only intercept paste on form inputs within task fields
      if (!target.closest('[data-task-field]')) return

      const text = e.clipboardData?.getData('text') ?? ''
      const charCount = text.length
      const fieldId = target.id || target.getAttribute('name') || 'unknown'

      if (session === 2) {
        e.preventDefault()
        pushTelemetry('PASTE_BLOCKED', taskCode, {
          character_count: charCount,
          field_id: fieldId,
        })
        pushTelemetry('INFRACTION', taskCode, {
          kind: 'attempted_paste',
          detail: `field=${fieldId}`,
        })
        setPasteBlockedMessage('Manual typing is required in this session.')
        // Clear the message after 4 seconds
        setTimeout(() => setPasteBlockedMessage(null), 4000)
      } else {
        pushTelemetry('PASTE', taskCode, {
          character_count: charCount,
          time_since_last_keystroke_ms: 0,
          field_id: fieldId,
        })
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [session, taskCode, pushTelemetry])

  const dismissTabModal = useCallback(() => setShowTabModal(false), [])
  const clearPasteBlockedMessage = useCallback(() => setPasteBlockedMessage(null), [])

  return {
    recordStart,
    recordFirstAnswer,
    recordEnd,
    getTimerDurations,
    onObjectiveChange,
    answerChangeCount,
    pasteBlockedMessage,
    clearPasteBlockedMessage,
    showTabModal,
    dismissTabModal,
  }
}
