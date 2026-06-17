import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { submitScales } from '@/lib/api'
import { useSessionStore } from '@/store/session'
import { Button } from '@/components/ui/Button'
import type { ScaleItem, SessionNumber } from '@/types'

// Item counts follow the research proposal Appendix H (S1 = 8, AI-usage = 4 AI-only,
// S2 = 6). Kept in sync with backend app/instruments.py SCALE_ITEMS.
const S1_EFFORT: ScaleItem[] = [
  { item_code: 'S1-E1', text: 'This task set required a lot of mental effort.', session: 1, group: 'ALL' },
  { item_code: 'S1-E2', text: 'I had to concentrate hard during the tasks.', session: 1, group: 'ALL' },
  { item_code: 'S1-E3', text: 'I felt mentally tired after completing the tasks.', session: 1, group: 'ALL' },
]
const S1_ENGAGEMENT: ScaleItem[] = [
  { item_code: 'S1-H1', text: 'I stayed actively involved while solving the tasks.', session: 1, group: 'ALL' },
  { item_code: 'S1-H2', text: 'I tried to understand each step, not only the final answer.', session: 1, group: 'ALL' },
  { item_code: 'S1-H3', text: 'I checked my reasoning before submitting answers.', session: 1, group: 'ALL' },
]
const S1_CONFIDENCE: ScaleItem[] = [
  { item_code: 'S1-C1', text: 'I felt confident that my answers were correct.', session: 1, group: 'ALL' },
  { item_code: 'S1-U1', text: 'I understood the steps I used to solve the tasks.', session: 1, group: 'ALL' },
]
const S1_AI_USAGE: ScaleItem[] = [
  { item_code: 'S1-AI1', text: 'I copied text from the AI assistance directly into my answers.', session: 1, group: 'AI_ASSISTED' },
  { item_code: 'S1-AI2', text: "I accepted the AI's answers without changing them.", session: 1, group: 'AI_ASSISTED' },
  { item_code: 'S1-AI3', text: 'I relied on the AI to do the thinking for me.', session: 1, group: 'AI_ASSISTED' },
  { item_code: 'S1-AI4', text: "I verified the AI's answers before using them.", session: 1, group: 'AI_ASSISTED' },
]
const S2_ENGAGEMENT: ScaleItem[] = [
  { item_code: 'S2-H1', text: 'I stayed actively involved while solving the tasks.', session: 2, group: 'ALL' },
  { item_code: 'S2-H2', text: 'I tried to understand each step, not only the final answer.', session: 2, group: 'ALL' },
  { item_code: 'S2-H3', text: 'I checked my reasoning before submitting answers.', session: 2, group: 'ALL' },
]
const S2_INDEPENDENCE: ScaleItem[] = [
  { item_code: 'S2-I1', text: 'I felt the tasks were harder without AI than I expected.', session: 2, group: 'ALL' },
  { item_code: 'S2-I2', text: 'I could explain my reasoning clearly without AI help.', session: 2, group: 'ALL' },
  { item_code: 'S2-I3', text: 'I verified my answers more carefully in Session 2.', session: 2, group: 'ALL' },
]

const LABELS: Record<number, string> = {
  1: 'Strongly disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly agree',
}

interface ScaleRowProps {
  item: ScaleItem
  value: number | null
  onChange: (v: number) => void
  error?: boolean
}

function ScaleRow({ item, value, onChange, error }: ScaleRowProps) {
  return (
    <div className={[
      'flex flex-col gap-3 px-4 py-4 rounded-card border',
      error ? 'border-error' : 'border-border-subtle bg-surface-card',
    ].join(' ')}>
      <p className="text-sm text-text-primary leading-relaxed">{item.text}</p>
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={item.text}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            title={LABELS[n]}
            className={[
              'flex flex-col items-center gap-1 min-h-[44px] min-w-[44px] w-12 px-2 py-2',
              'rounded-input border text-xs font-semibold cursor-pointer',
              'transition-[background-color,border-color,color] duration-150',
              'focus-within:ring-2 focus-within:ring-accent/40 focus-within:ring-offset-1 focus-within:ring-offset-background',
              value === n
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-background border-border-subtle text-text-secondary hover:bg-surface-hover',
            ].join(' ')}
          >
            <input
              type="radio"
              name={item.item_code}
              value={String(n)}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            {n}
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs text-text-disabled px-1">
        <span>Strongly disagree</span>
        <span>Strongly agree</span>
      </div>
    </div>
  )
}

interface ScalesSectionProps {
  title: string
  items: ScaleItem[]
  ratings: Record<string, number>
  onRate: (code: string, value: number) => void
  errorCodes: string[]
}

function ScalesSection({ title, items, ratings, onRate, errorCodes }: ScalesSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
        {title}
      </h2>
      {items.map((item) => (
        <ScaleRow
          key={item.item_code}
          item={item}
          value={ratings[item.item_code] ?? null}
          onChange={(v) => onRate(item.item_code, v)}
          error={errorCodes.includes(item.item_code)}
        />
      ))}
    </section>
  )
}

interface ScalesPageProps {
  session: SessionNumber
}

export default function ScalesPage({ session }: ScalesPageProps) {
  const navigate = useNavigate()
  const participantCode = useSessionStore((s) => s.participant_code)
  const group = useSessionStore((s) => s.group_assignment)
  const setStatus = useSessionStore((s) => s.setStatus)
  const setStep = useSessionStore((s) => s.setStep)

  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [errorCodes, setErrorCodes] = useState<string[]>([])

  const isAI = group === 'AI_ASSISTED'
  const items: ScaleItem[] =
    session === 1
      ? [...S1_EFFORT, ...S1_ENGAGEMENT, ...S1_CONFIDENCE, ...(isAI ? S1_AI_USAGE : [])]
      : [...S2_ENGAGEMENT, ...S2_INDEPENDENCE]

  const mutation = useMutation({
    mutationFn: () =>
      submitScales({
        participant_code: participantCode!,
        session_number: session,
        items: items.map((item) => ({
          item_code: item.item_code,
          rating: ratings[item.item_code] as 1 | 2 | 3 | 4 | 5,
        })),
      }),
    onSuccess: () => {
      if (session === 1) {
        setStatus('BREAK')
        setStep('break')
        navigate('/break', { replace: true })
      } else {
        setStatus('COMPLETED')
        setStep('completed')
        navigate('/complete', { replace: true })
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const missing = items.filter((i) => !(i.item_code in ratings)).map((i) => i.item_code)
    if (missing.length > 0) {
      setErrorCodes(missing)
      document.getElementById(`scale-${missing[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setErrorCodes([])
    mutation.mutate()
  }

  const handleRate = (code: string, value: number) => {
    setRatings((r) => ({ ...r, [code]: value }))
    setErrorCodes((e) => e.filter((c) => c !== code))
  }

  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">
            Session {session} · post-block scales
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Rate your experience
          </h1>
          <p className="text-sm text-text-secondary">
            Answer how you felt about the tasks you just completed.
          </p>
        </div>

        {errorCodes.length > 0 && (
          <div role="alert" className="rounded-card border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            Please rate all items before continuing.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
          {session === 1 ? (
            <>
              <ScalesSection title="Effort" items={S1_EFFORT} ratings={ratings} onRate={handleRate} errorCodes={errorCodes} />
              <ScalesSection title="Engagement" items={S1_ENGAGEMENT} ratings={ratings} onRate={handleRate} errorCodes={errorCodes} />
              <ScalesSection title="Confidence and understanding" items={S1_CONFIDENCE} ratings={ratings} onRate={handleRate} errorCodes={errorCodes} />
              {isAI && (
                <ScalesSection title="AI usage" items={S1_AI_USAGE} ratings={ratings} onRate={handleRate} errorCodes={errorCodes} />
              )}
            </>
          ) : (
            <>
              <ScalesSection title="Engagement" items={S2_ENGAGEMENT} ratings={ratings} onRate={handleRate} errorCodes={errorCodes} />
              <ScalesSection title="Independence self-check" items={S2_INDEPENDENCE} ratings={ratings} onRate={handleRate} errorCodes={errorCodes} />
            </>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              loading={mutation.isPending}
              className="w-full"
            >
              {session === 1 ? 'Continue to break' : 'Complete the study'}
            </Button>
            <p className="text-xs text-center text-text-disabled">
              Back is not available · answers are final.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
