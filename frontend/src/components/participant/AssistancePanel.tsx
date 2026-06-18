import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { requestHint } from '@/lib/api'
import { useSessionStore } from '@/store/session'

const LEVEL_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Level 1 · Hint',
  2: 'Level 2 · Scaffold',
  3: 'Level 3 · Worked steps',
}

interface AssistancePanelProps {
  taskCode: string
  participantCode: string
}

export function AssistancePanel({ taskCode, participantCode }: AssistancePanelProps) {
  const hintState = useSessionStore((s) => s.hint_state[taskCode])
  const updateHintState = useSessionStore((s) => s.updateHintState)
  const pushTelemetry = useSessionStore((s) => s.pushTelemetry)

  const [loadingLevel, setLoadingLevel] = useState<1 | 2 | 3 | null>(null)
  const [copiedLevel, setCopiedLevel] = useState<1 | 2 | 3 | null>(null)
  const revealRefs = useRef<Partial<Record<1 | 2 | 3, HTMLDivElement | null>>>({})
  const intersectionTimers = useRef<Partial<Record<1 | 2 | 3, number>>>({})

  const unlockedLevel = hintState?.unlocked_level ?? 0
  const hints = hintState?.hints ?? {}
  const requestCount = hintState?.request_count ?? 0

  const requestMutation = useMutation({
    mutationFn: (level: 1 | 2 | 3) =>
      requestHint({ participant_code: participantCode, task_code: taskCode, level }),
    onMutate: (level) => {
      setLoadingLevel(level)
      // Emit HINT_UNLOCK telemetry
      pushTelemetry('HINT_UNLOCK', taskCode, {
        level,
        request_number: requestCount + 1,
        t_offset_ms: 0,
      })
    },
    onSuccess: (data) => {
      const level = data.level as 1 | 2 | 3
      const now = performance.now()
      updateHintState(taskCode, {
        unlocked_level: level,
        hints: { ...hints, [level]: data.hint_text },
        request_count: requestCount + 1,
        reveal_timestamps: {
          ...(hintState?.reveal_timestamps ?? {}),
          [level]: now,
        },
      })
      setLoadingLevel(null)
    },
    onError: () => {
      setLoadingLevel(null)
    },
  })

  const handleUnlock = (level: 1 | 2 | 3) => {
    if (loadingLevel !== null) return
    if (level !== (unlockedLevel + 1 as 1 | 2 | 3)) return
    requestMutation.mutate(level)
  }

  const handleCopy = (level: 1 | 2 | 3) => {
    const text = hints[level]
    if (!text) return
    navigator.clipboard.writeText(text).catch(() => undefined)
    pushTelemetry('HINT_COPY', taskCode, { level })
    setCopiedLevel(level)
    updateHintState(taskCode, { copied: true })
  }

  // Track intersection time for viewed_duration_ms
  useEffect(() => {
    const observers: IntersectionObserver[] = []

    for (const lvl of [1, 2, 3] as const) {
      const el = revealRefs.current[lvl]
      if (!el) continue

      let enteredAt: number | null = null

      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          enteredAt = performance.now()
        } else if (enteredAt !== null) {
          const duration = performance.now() - enteredAt
          intersectionTimers.current[lvl] = (intersectionTimers.current[lvl] ?? 0) + duration
          enteredAt = null
        }
      })

      obs.observe(el)
      observers.push(obs)
    }

    return () => observers.forEach((o) => o.disconnect())
  }, [unlockedLevel])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-text-primary">Assistance</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          You may request structured assistance. Use the lowest level you need. You must write
          your final answer and justification in your own words.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {([1, 2, 3] as const).map((level) => {
          const isUnlocked = level <= unlockedLevel
          const isNextLevel = level === (unlockedLevel + 1 as 1 | 2 | 3) && unlockedLevel < 3
          const isLocked = !isUnlocked && !isNextLevel
          const isLoading = loadingLevel === level
          const hintText = hints[level]

          return (
            <div key={level} className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isLocked || isLoading || requestMutation.isPending}
                onClick={() => handleUnlock(level)}
                aria-pressed={isUnlocked}
                className={[
                  'flex items-center justify-between w-full',
                  'min-h-[44px] px-4 py-2.5 rounded-input border text-sm',
                  'transition-[background-color,border-color,opacity] duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                  isLocked
                    ? 'bg-surface-card border-border-subtle text-text-disabled cursor-not-allowed'
                    : isUnlocked
                    ? 'bg-accent/10 border-accent text-accent cursor-default'
                    : 'bg-surface-card border-border-subtle text-text-secondary hover:bg-surface-hover hover:text-text-primary cursor-pointer',
                ].join(' ')}
              >
                <span className="font-medium">{LEVEL_LABELS[level]}</span>
                {isLocked && (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {isLoading && (
                  <svg className="w-4 h-4 shrink-0 animate-spin text-accent" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </button>

              {/* Skeleton shimmer while loading */}
              {isLoading && (
                <div className="rounded-input bg-surface-hover border border-border-subtle p-3 overflow-hidden">
                  <div className="flex flex-col gap-2">
                    <div className="h-3 bg-surface-card rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-surface-card rounded animate-pulse w-1/2" />
                  </div>
                </div>
              )}

              {/* Revealed hint */}
              {isUnlocked && hintText && !isLoading && (
                <div
                  ref={(el) => { revealRefs.current[level] = el }}
                  className="rounded-input bg-surface-hover border border-border-subtle p-3"
                >
                  <p className="text-sm text-text-primary leading-relaxed font-mono whitespace-pre-wrap">
                    {hintText}
                  </p>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(level)}
                      className={[
                        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded',
                        'border border-border-subtle text-text-secondary',
                        'hover:bg-surface-card hover:text-text-primary transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                        copiedLevel === level ? 'text-warning border-warning/30' : '',
                      ].join(' ')}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
