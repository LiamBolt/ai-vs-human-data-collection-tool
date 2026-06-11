import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/store/session'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

const S2_RULES =
  'AI is removed for everyone in Session 2. No AI, no internet search, no help. Solve independently. Show brief working and write justifications in your own words. Answer checks after each task.'

export default function Session2IntroPage() {
  const navigate = useNavigate()
  const pushTelemetry = useSessionStore((s) => s.pushTelemetry)
  const setSession2Enforcement = useSessionStore((s) => s.setSession2Enforcement)
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession)
  const setStep = useSessionStore((s) => s.setStep)

  const handleStart = () => {
    setSession2Enforcement(true)
    setCurrentSession(2)
    pushTelemetry('SESSION_START', null, { session: 2 })
    setStep('s2_task_A3')
    navigate('/s2/task/A3', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">
            Session 2
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Independent Session
          </h1>
        </div>

        <div className="rounded-card border border-warning/30 bg-warning/5 px-5 py-4">
          <p className="text-sm font-semibold text-warning mb-1">AI assistance removed</p>
          <p className="text-xs text-text-secondary">
            For everyone in this session, AI and internet access are disabled.
          </p>
        </div>

        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-disabled mb-3">
              Session rules
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{S2_RULES}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-disabled mb-3">
              Important — tab switching
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Please stay on this page throughout Session 2. Switching tabs or windows will be
              recorded and shown to your proctor.
            </p>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="button" onClick={handleStart} className="w-full">
            Start Session 2
          </Button>
          <p className="text-xs text-center text-text-disabled">
            Back is not available — answers are final once submitted.
          </p>
        </div>
      </div>
    </div>
  )
}
