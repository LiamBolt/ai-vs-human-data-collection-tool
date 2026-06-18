import { BrandLogo } from '@/components/ui/BrandLogo'
import { StepProgress } from '@/components/ui/StepProgress'
import { getJourneyProgress, type JourneyPhaseKey } from '@/lib/journey'

interface FormProgressHeaderProps {
  /** Where this form sits in the whole-study journey (drives the overall bar). */
  phase: JourneyPhaseKey
  /** Small uppercase context label, e.g. "Background information". */
  eyebrow: string
  /** Title of the step currently on screen, e.g. "About you". */
  stepTitle: string
  /** 0-based index of the active step within this form. */
  currentStep: number
  /** Total number of steps in this form. */
  totalSteps: number
}

/**
 * Sticky header shared by the multi-step participant forms. It carries the brand
 * mark, the divided per-form progress bar (one pill per step of the form being
 * filled right now), and a slim "overall" bar showing position in the whole
 * study. Keeping both bars here means the page body holds only a few fields at a
 * time, so the participant never faces a long scroll.
 */
export function FormProgressHeader({
  phase,
  eyebrow,
  stepTitle,
  currentStep,
  totalSteps,
}: FormProgressHeaderProps) {
  const journey = getJourneyProgress(phase)

  return (
    <div className="sticky top-0 z-20 -mx-6 px-6 pt-5 pb-4 sm:-mx-8 sm:px-8 bg-background/85 backdrop-blur-md border-b border-border-subtle">
      <div className="flex items-center gap-3">
        <BrandLogo size={26} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-accent truncate">
            {eyebrow}
          </p>
          <p className="text-sm font-semibold text-text-primary truncate">{stepTitle}</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-text-secondary tabular-nums">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Divided bar for the current form */}
      <StepProgress
        total={totalSteps}
        current={currentStep + 1}
        ariaLabel={`${eyebrow}: step ${currentStep + 1} of ${totalSteps}`}
        className="mt-3"
      />

      {/* Slim overall bar for the whole study */}
      <div className="mt-3 flex items-center gap-2.5">
        <div
          className="h-1 flex-1 rounded-full bg-border-subtle overflow-hidden"
          role="progressbar"
          aria-valuenow={journey.index + 1}
          aria-valuemin={1}
          aria-valuemax={journey.total}
          aria-label={`Overall study progress: ${journey.label}`}
        >
          <div
            className="h-full rounded-full bg-text-disabled transition-[width] duration-500 ease-smooth"
            style={{ width: `${journey.pct}%` }}
          />
        </div>
        <span className="shrink-0 text-[11px] text-text-disabled tabular-nums">
          Overall {journey.pct}% · {journey.label}
        </span>
      </div>
    </div>
  )
}
