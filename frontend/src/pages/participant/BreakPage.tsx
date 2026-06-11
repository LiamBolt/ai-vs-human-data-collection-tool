import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { startBreak, getBreakStatus, completeBreak } from '@/lib/api'
import { useSessionStore } from '@/store/session'
import { useBreakTimer } from '@/hooks/useBreakTimer'
import { formatMMSS, playChime } from '@/lib/utils'

const RING_RADIUS = 100
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export default function BreakPage() {
  const navigate = useNavigate()
  const participantCode = useSessionStore((s) => s.participant_code)
  const breakEndsAt = useSessionStore((s) => s.break_ends_at)
  const setBreakEndsAt = useSessionStore((s) => s.setBreakEndsAt)
  const setStep = useSessionStore((s) => s.setStep)
  const setStatus = useSessionStore((s) => s.setStatus)
  const pushTelemetry = useSessionStore((s) => s.pushTelemetry)

  const chimePlayedRef = useRef(false)
  const completedRef = useRef(false)

  // Fetch current break status from server (refresh-proof)
  useQuery({
    queryKey: ['break-status', participantCode],
    queryFn: () => getBreakStatus(participantCode!),
    enabled: !!participantCode && !breakEndsAt,
    onSuccess: (data) => {
      setBreakEndsAt(data.break_ends_at)
    },
  })

  // Start break if not started
  const startMutation = useMutation({
    mutationFn: () => startBreak(participantCode!),
    onSuccess: (data) => {
      setBreakEndsAt(data.break_ends_at)
      pushTelemetry('BREAK_START', null)
    },
  })

  useEffect(() => {
    if (!breakEndsAt && participantCode) {
      startMutation.mutate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completeMutation = useMutation({
    mutationFn: () => completeBreak(participantCode!),
    onSuccess: () => {
      setStatus('SESSION2')
      setStep('s2_intro')
      pushTelemetry('BREAK_END', null)
      navigate('/s2/intro', { replace: true })
    },
  })

  const { remainingMs, progressFraction, isExpired } = useBreakTimer(breakEndsAt)
  const remainingSeconds = remainingMs / 1000

  // Auto-advance when expired
  useEffect(() => {
    if (isExpired && !completedRef.current) {
      completedRef.current = true
      if (!chimePlayedRef.current) {
        chimePlayedRef.current = true
        playChime()
      }
      completeMutation.mutate()
    }
  }, [isExpired]) // eslint-disable-line react-hooks/exhaustive-deps

  const strokeOffset = RING_CIRCUMFERENCE * progressFraction

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-8 text-center">
        {/* Radial countdown ring */}
        <div className="relative w-[220px] h-[220px]" aria-hidden="true">
          <svg
            viewBox="0 0 220 220"
            className="w-full h-full -rotate-90"
          >
            {/* Track */}
            <circle
              cx="110"
              cy="110"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="10"
            />
            {/* Progress arc */}
            <circle
              cx="110"
              cy="110"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              className="transition-[stroke-dashoffset] duration-1000"
            />
          </svg>

          {/* Time readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-4xl font-bold tabular-nums text-text-primary"
              aria-live="off"
            >
              {formatMMSS(remainingSeconds)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-text-primary">
            Session 1 complete
          </h1>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
            Please take a short rest. Session 2 will begin automatically when the timer
            reaches zero.
          </p>
        </div>

        <p
          className="text-sm text-text-disabled"
          role="status"
          aria-live="polite"
          aria-label={`${Math.ceil(remainingSeconds)} seconds remaining`}
        >
          {isExpired ? 'Proceeding to Session 2…' : 'Please wait…'}
        </p>
      </div>
    </div>
  )
}
