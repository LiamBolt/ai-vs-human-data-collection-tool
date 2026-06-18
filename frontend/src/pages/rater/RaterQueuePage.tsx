import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRaterQueue, submitRaterScore } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { RaterResponse, RaterScorePayload } from '@/types'

// Segmented 0–2 control
interface SegmentedScore {
  label: string
  value: number
  onChange: (v: number) => void
  options: Array<{ score: 0 | 1 | 2; label: string; anchor: string }>
  error?: boolean
}

function ScoreControl({ label, value, onChange, options, error }: SegmentedScore) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-disabled">{label}</p>
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => (
          <label
            key={opt.score}
            className={[
              'flex items-start gap-3 min-h-[44px] px-3 py-2.5 rounded-input border cursor-pointer',
              'transition-colors duration-150 focus-within:ring-2 focus-within:ring-accent/40 focus-within:ring-offset-1 focus-within:ring-offset-background',
              value === opt.score
                ? 'bg-accent/10 border-accent'
                : 'bg-surface-card border-border-subtle hover:bg-surface-hover',
              error ? 'border-error' : '',
            ].join(' ')}
          >
            <input
              type="radio"
              name={label}
              value={opt.score}
              checked={value === opt.score}
              onChange={() => onChange(opt.score)}
              className="mt-0.5 w-4 h-4 accent-accent shrink-0 focus:outline-none"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-text-primary">{opt.score}</span>
              <span className="text-xs text-text-secondary">{opt.anchor}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function RaterQueuePage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const displayCode = useAuthStore((s) => s.display_code)
  const setFloatingToggleMode = useThemeStore((s) => s.setFloatingToggleMode)
  const qc = useQueryClient()

  // The console hosts brightness in its sidebar → hide the floating toggle.
  useEffect(() => {
    setFloatingToggleMode('hide')
    return () => setFloatingToggleMode('show')
  }, [setFloatingToggleMode])

  const { data: queue = [], isLoading, refetch } = useQuery({
    queryKey: ['rater-queue'],
    queryFn: getRaterQueue,
  })

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [correctness, setCorrectness] = useState<number>(-1)
  const [justQuality, setJustQuality] = useState<number>(-1)
  const [independence, setIndependence] = useState<number>(-1)
  const [submitErrors, setSubmitErrors] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (payload: RaterScorePayload) => submitRaterScore(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rater-queue'] })
      refetch()
      const next = selectedIdx >= queue.length - 2 ? 0 : selectedIdx
      setSelectedIdx(next)
      setCorrectness(-1); setJustQuality(-1); setIndependence(-1)
      setSubmitErrors(false)
    },
  })

  const handleSubmit = (response: RaterResponse) => {
    if (correctness === -1 || justQuality === -1 || independence === -1) {
      setSubmitErrors(true)
      return
    }
    mutation.mutate({
      response_id: response.response_id,
      correctness: correctness as 0 | 1 | 2,
      justification_quality: justQuality as 0 | 1 | 2,
      independence: independence as 0 | 1 | 2,
    })
  }

  const handleSignOut = () => { clearAuth(); navigate('/rater/login', { replace: true }) }

  const selected: RaterResponse | undefined = queue[selectedIdx]

  // Shared queue sidebar body — reused by the desktop rail and the mobile drawer.
  const sidebarBody = (
    <>
      <div className="px-4 py-4 border-b border-border-subtle flex flex-col gap-3">
        <BrandLogo size={30} withWordmark subtitle="Rater panel" />
        <div>
          <p className="text-xs text-text-disabled">Rater · {displayCode}</p>
          <p className="text-sm font-semibold text-text-primary mt-0.5">
            {queue.length} response{queue.length !== 1 ? 's' : ''} to score
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {isLoading && <p className="text-xs text-text-disabled px-4 py-3">Loading…</p>}
        {queue.map((r, idx) => (
          <button
            key={r.response_id}
            type="button"
            onClick={() => {
              setSelectedIdx(idx)
              setCorrectness(-1); setJustQuality(-1); setIndependence(-1)
              setSubmitErrors(false)
              setDrawerOpen(false)
            }}
            className={[
              'w-full flex flex-col gap-0.5 px-4 py-3 text-left min-h-[44px]',
              'transition-colors duration-150 focus-visible:outline-none focus-visible:bg-surface-hover',
              idx === selectedIdx
                ? 'bg-accent/10 border-l-2 border-accent'
                : 'hover:bg-surface-hover',
            ].join(' ')}
          >
            <span className="text-xs font-semibold text-text-primary font-mono">
              {r.task_code} · S{r.session_number}
            </span>
            <span className="text-xs text-text-disabled truncate">{r.response_id.slice(0, 16)}…</span>
          </button>
        ))}
        {!isLoading && queue.length === 0 && (
          <p className="text-xs text-text-disabled px-4 py-3">No responses in queue.</p>
        )}
      </div>

      <div className="px-4 py-4 border-t border-border-subtle flex items-center justify-between gap-2">
        <button type="button" onClick={handleSignOut} className="text-xs text-text-disabled hover:text-text-secondary">Sign out</button>
        <ThemeToggle />
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop queue rail (≥ lg) */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-surface-card border-r border-border-subtle flex-col">
        {sidebarBody}
      </aside>

      {/* Mobile top bar (< lg) */}
      <header className="lg:hidden fixed inset-x-0 top-0 z-30 flex items-center justify-between h-14 pl-4 pr-14 bg-surface-card border-b border-border-subtle">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open response queue"
          aria-expanded={drawerOpen}
          className="flex items-center gap-2 min-h-[44px] px-2 -ml-2 rounded-input text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-sm font-medium text-text-primary">Queue ({queue.length})</span>
        </button>
        <BrandLogo size={26} withWordmark />
      </header>

      {/* Mobile drawer + backdrop (< lg) */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-64 max-w-[80%] bg-surface-card border-r border-border-subtle flex flex-col shadow-glass animate-[fadeIn_200ms_ease-out]">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close response queue"
              className="absolute top-3 right-3 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-input text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {sidebarBody}
          </aside>
        </div>
      )}

      {/* Scoring area — offset below the fixed top bar on mobile only */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {!selected ? (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-sm text-text-disabled">
              {queue.length === 0 ? 'All responses scored.' : 'Select a response from the list.'}
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-disabled">
                {selectedIdx + 1} of {queue.length} · Task {selected.task_code} · Session {selected.session_number}
              </p>
            </div>

            {/* Response — ONLY question + answer + justification */}
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-disabled">Question</p>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                <p className="text-sm text-text-primary leading-relaxed font-medium">
                  {selected.objective_question}
                </p>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider">Participant answer</p>
                  <p className="text-sm text-text-primary font-mono bg-surface-hover rounded-input px-3 py-2">
                    {selected.objective_answer}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider">Justification</p>
                  <p className="text-sm text-text-primary leading-relaxed bg-surface-hover rounded-input px-3 py-3 whitespace-pre-wrap">
                    {selected.text_justification}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Scoring controls */}
            <div className="flex flex-col gap-6">
              {submitErrors && (
                <p role="alert" className="text-xs text-error">
                  Please rate all three dimensions before submitting.
                </p>
              )}

              <ScoreControl
                label="Correctness"
                value={correctness}
                onChange={setCorrectness}
                error={submitErrors && correctness === -1}
                options={[
                  { score: 0, label: '0', anchor: 'Incorrect' },
                  { score: 1, label: '1', anchor: 'Partially correct' },
                  { score: 2, label: '2', anchor: 'Fully correct' },
                ]}
              />

              <ScoreControl
                label="Justification quality"
                value={justQuality}
                onChange={setJustQuality}
                error={submitErrors && justQuality === -1}
                options={[
                  { score: 0, label: '0', anchor: 'Absent or irrelevant' },
                  { score: 1, label: '1', anchor: 'Partial reasoning' },
                  { score: 2, label: '2', anchor: 'Clear, complete reasoning' },
                ]}
              />

              <ScoreControl
                label="Independence"
                value={independence}
                onChange={setIndependence}
                error={submitErrors && independence === -1}
                options={[
                  { score: 0, label: '0', anchor: 'Appears dependent or copied' },
                  { score: 1, label: '1', anchor: 'Mixed' },
                  { score: 2, label: '2', anchor: 'Clearly independent reasoning in own words' },
                ]}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                loading={mutation.isPending}
                onClick={() => handleSubmit(selected)}
              >
                Submit &amp; next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
