import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { FormShell } from '@/components/ui/FormShell'
import { useSessionStore } from '@/store/session'

export default function ConsentPage() {
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const setStatus = useSessionStore((s) => s.setStatus)
  const setStep = useSessionStore((s) => s.setStep)

  const handleConsent = () => {
    if (!agreed) {
      setError('You must check the box to continue.')
      return
    }
    setStatus('FORM0')
    setStep('form0')
    navigate('/form0', { replace: true })
  }

  const handleWithdraw = () => {
    setStatus('WITHDRAWN')
    navigate('/withdrawn', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <FormShell
        maxWidth="max-w-2xl"
        eyebrow="Before you begin"
        title="Participant Information & Consent"
      >
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-text-primary">Purpose of the study</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              This is a research study on how people solve problems with and without AI assistance.
              We are investigating patterns of cognitive engagement and AI reliance in data-based
              problem solving.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-text-primary">What participation involves</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              You will be asked to solve a series of short problems across two sessions with a brief
              rest in between. The total time is approximately 90 minutes. Some participants will
              have access to structured assistance for Session 1; all participants will work
              independently in Session 2.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-text-primary">Voluntary participation</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Participation is entirely voluntary. You may withdraw at any time and for any reason
              without consequence. Withdrawal will not affect your grades, employment, or access
              to any services.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-text-primary">Privacy and anonymity</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              No names, phone numbers, email addresses, or personal identifiers of any kind are
              recorded. Your responses are stored under an anonymous Participant ID only. The data
              you provide will be used solely for research purposes.
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-glass-border pt-5">
          <Checkbox
            label="I have read and understood the above and I agree to take part."
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked)
              setError(null)
            }}
          />

          {error && <p role="alert" className="text-xs text-error">{error}</p>}

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              disabled={!agreed}
              onClick={handleConsent}
              className="w-full"
            >
              I agree · continue to the study
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleWithdraw}
              className="w-full text-text-disabled hover:text-text-secondary"
            >
              I do not consent · exit
            </Button>
          </div>
        </div>
      </FormShell>
    </div>
  )
}
