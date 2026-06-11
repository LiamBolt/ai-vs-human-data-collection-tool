import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { resumeSession } from '@/lib/api'
import { useSessionStore } from '@/store/session'
import { resolveStepRoute } from './routeUtils'

export default function WaitingPage() {
  const navigate = useNavigate()
  const participantCode = useSessionStore((s) => s.participant_code)
  const setParticipant = useSessionStore((s) => s.setParticipant)

  useEffect(() => {
    if (!participantCode) {
      navigate('/', { replace: true })
      return
    }

    let cancelled = false

    const poll = async () => {
      try {
        const data = await resumeSession(participantCode)
        if (cancelled) return

        if (data.group_assignment !== null) {
          setParticipant(
            data.participant_code,
            data.status,
            data.current_step,
            data.group_assignment,
            data.current_session,
            data.break_ends_at,
            data.draft_responses,
          )
          const route = resolveStepRoute(data.status, data.current_step)
          navigate(route, { replace: true })
        }
      } catch {
        // Network failure — will retry
      }
    }

    poll()
    const interval = setInterval(poll, 5_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [participantCode, navigate, setParticipant])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center flex flex-col gap-6">
        <svg
          className="w-12 h-12 mx-auto text-accent animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-text-primary">Thank you</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Please wait — your proctor will confirm your group assignment before the study
            begins.
          </p>
        </div>

        <p className="text-xs text-text-disabled">
          This page updates automatically.
        </p>
      </div>
    </div>
  )
}
