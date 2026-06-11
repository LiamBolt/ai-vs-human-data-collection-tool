import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { resumeSession } from '@/lib/api'
import { useSessionStore } from '@/store/session'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FormShell } from '@/components/ui/FormShell'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { findStoredParticipantCode } from '@/lib/utils'
import { resolveStepRoute } from './routeUtils'

export default function WelcomePage() {
  const [code, setCode] = useState(() => findStoredParticipantCode() ?? '')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const setParticipant = useSessionStore((s) => s.setParticipant)

  const mutation = useMutation({
    mutationFn: () => resumeSession(code.trim()),
    onSuccess: (data) => {
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
    },
    onError: () => {
      setError('Participant ID not found. Check with your proctor and try again.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!code.trim()) {
      setError('Please enter your Participant ID.')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo size={76} />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              AI vs the Brain
            </h1>
            <p className="text-sm text-text-secondary">
              Research Data Collection Platform
            </p>
          </div>
        </div>

        <FormShell
          showBrand={false}
          eyebrow="Participant access"
          title="Sign in to continue"
          subtitle="Enter the Participant ID your proctor gave you. Your progress is saved automatically."
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <Input
              label="Participant ID"
              id="participant-code"
              name="participant-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError(null)
              }}
              error={error ?? undefined}
              inputWidth="w-full"
              autoFocus
              aria-label="Enter your Participant ID"
            />

            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={!code.trim()}
              className="w-full"
            >
              Continue
            </Button>
          </form>
        </FormShell>
      </div>
    </div>
  )
}
