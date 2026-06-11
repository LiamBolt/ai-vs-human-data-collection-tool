import { useEffect, useRef, useCallback } from 'react'
import { syncState } from '@/lib/api'
import { useSessionStore } from '@/store/session'

const SYNC_INTERVAL_MS = 30_000
const MAX_BACKOFF_MS = 60_000

export function useSessionSync() {
  const participantCode = useSessionStore((s) => s.participant_code)
  const currentStep = useSessionStore((s) => s.current_step)
  const draftAnswers = useSessionStore((s) => s.draft_answers)
  const telemetryBuffer = useSessionStore((s) => s.telemetry_buffer)
  const markTelemetrySent = useSessionStore((s) => s.markTelemetrySent)
  const setSyncStatus = useSessionStore((s) => s.setSyncStatus)

  const backoffRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSyncingRef = useRef(false)

  const performSync = useCallback(async () => {
    if (!participantCode || !currentStep) return
    if (isSyncingRef.current) return

    isSyncingRef.current = true
    setSyncStatus('syncing')

    const eventsToSend = [...telemetryBuffer]
    const sentIds = eventsToSend.map((e) => e.client_event_id)

    try {
      await syncState({
        participant_code: participantCode,
        current_step: currentStep,
        draft_responses: draftAnswers,
        telemetry_batch: eventsToSend,
      })

      markTelemetrySent(sentIds)
      setSyncStatus('synced')
      backoffRef.current = 0
    } catch {
      setSyncStatus('offline')
      // Exponential backoff up to MAX_BACKOFF_MS
      const delay = Math.min(
        backoffRef.current === 0 ? 5_000 : backoffRef.current * 2,
        MAX_BACKOFF_MS,
      )
      backoffRef.current = delay
      retryTimerRef.current = setTimeout(performSync, delay)
    } finally {
      isSyncingRef.current = false
    }
  }, [
    participantCode,
    currentStep,
    draftAnswers,
    telemetryBuffer,
    markTelemetrySent,
    setSyncStatus,
  ])

  // Regular 30s interval
  useEffect(() => {
    if (!participantCode) return

    const interval = setInterval(performSync, SYNC_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [participantCode, performSync])

  // Cleanup retry timer on unmount
  useEffect(
    () => () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    },
    [],
  )

  // Expose manual trigger for blur-based sync
  return { syncNow: performSync }
}
