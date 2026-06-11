import { useState, useEffect, useRef } from 'react'
import { clamp } from '@/lib/utils'

interface BreakTimerResult {
  remainingMs: number
  totalDurationMs: number
  progressFraction: number
  isExpired: boolean
}

export function useBreakTimer(
  breakEndsAt: string | null,
  totalDurationSeconds = 300,
): BreakTimerResult {
  const totalDurationMs = totalDurationSeconds * 1000

  const computeRemaining = () => {
    if (!breakEndsAt) return totalDurationMs
    const endsAtMs = new Date(breakEndsAt).getTime()
    return clamp(endsAtMs - Date.now(), 0, totalDurationMs)
  }

  const [remainingMs, setRemainingMs] = useState(computeRemaining)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!breakEndsAt) return

    const tick = () => {
      const remaining = computeRemaining()
      setRemainingMs(remaining)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakEndsAt])

  const progressFraction = clamp(1 - remainingMs / totalDurationMs, 0, 1)

  return {
    remainingMs,
    totalDurationMs,
    progressFraction,
    isExpired: remainingMs <= 0,
  }
}
