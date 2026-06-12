import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/store/session'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

const CONTROL_RULES =
  'No AI, no internet search, no notes, no help from other people. Work quietly and do not discuss answers. Write clearly. Show brief working for numeric tasks. Answer the checks after each task.'

const AI_RULES =
  'You may request structured assistance only through the approved channel. Use the lowest help level needed (0–3). You must write your final answer and justification in your own words. If you use wording from assistance, tick Copy used = Yes. If you verify, tick Verified = Yes and write one sentence of evidence. Assistance ladder: 0 none, 1 hint, 2 scaffold, 3 near-complete worked steps.'

export default function Session1IntroPage() {
  const navigate = useNavigate()
  const group = useSessionStore((s) => s.group_assignment)
  const pushTelemetry = useSessionStore((s) => s.pushTelemetry)
  const setStep = useSessionStore((s) => s.setStep)

  const isAI = group === 'AI_ASSISTED'
  const rules = isAI ? AI_RULES : CONTROL_RULES

  const handleStart = () => {
    pushTelemetry('SESSION_START', null, { session: 1 })
    setStep('s1_task_A1')
    navigate('/s1/task/A1', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">
            Session 1
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {isAI ? 'AI-Assisted Session' : 'Independent Session'}
          </h1>
        </div>

        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-disabled mb-3">
              Session rules
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{rules}</p>
          </CardBody>
        </Card>

        {isAI && (
          <div className="rounded-card border border-accent/30 bg-accent/5 px-5 py-4">
            <p className="text-sm font-medium text-accent mb-2">Assistance ladder</p>
            <ul className="flex flex-col gap-1 text-xs text-text-secondary">
              <li><span className="font-medium text-text-primary">Level 0</span> — No assistance</li>
              <li><span className="font-medium text-text-primary">Level 1</span> — Hint</li>
              <li><span className="font-medium text-text-primary">Level 2</span> — Scaffold</li>
              <li><span className="font-medium text-text-primary">Level 3</span> — Near-complete worked steps</li>
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button type="button" onClick={handleStart} className="w-full">
            Start Session 1
          </Button>
          <p className="text-xs text-center text-text-disabled">
            Back is not available — answers are final once submitted.
          </p>
        </div>
      </div>
    </div>
  )
}
