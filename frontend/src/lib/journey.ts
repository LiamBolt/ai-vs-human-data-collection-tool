/**
 * The participant's end-to-end path through the study. Used by the "overall"
 * (mega) progress bar so that, on any single screen, the participant can see how
 * far along the whole journey they are — not just within the current form.
 */
export const JOURNEY_PHASES = [
  { key: 'consent', label: 'Consent' },
  { key: 'background', label: 'Background' },
  { key: 'session1', label: 'Session 1' },
  { key: 'reflect1', label: 'Reflection 1' },
  { key: 'break', label: 'Break' },
  { key: 'session2', label: 'Session 2' },
  { key: 'reflect2', label: 'Reflection 2' },
  { key: 'done', label: 'Done' },
] as const

export type JourneyPhaseKey = (typeof JOURNEY_PHASES)[number]['key']

export interface JourneyProgress {
  index: number
  total: number
  label: string
  /** Position within the whole study, 0–100. */
  pct: number
}

export function getJourneyProgress(key: JourneyPhaseKey): JourneyProgress {
  const index = JOURNEY_PHASES.findIndex((p) => p.key === key)
  const total = JOURNEY_PHASES.length
  return {
    index,
    total,
    label: JOURNEY_PHASES[index]?.label ?? '',
    // (index + 1) so the very first phase shows a real sliver, never an empty bar.
    pct: Math.round(((index + 1) / total) * 100),
  }
}
