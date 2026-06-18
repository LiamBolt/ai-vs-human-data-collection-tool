interface StepProgressProps {
  /** Total number of segments. */
  total: number
  /** 1-based index of the active segment (segments before it read as done). */
  current: number
  /** Optional accessible label, e.g. "Step 2 of 3". */
  ariaLabel?: string
  className?: string
}

/**
 * A divided (segmented) progress bar: one pill per step so the participant can
 * see, at a glance, both how many steps the current form has and where they are
 * in it. Completed and active segments fill with the accent; upcoming segments
 * stay subtle. Width is even across segments so the division reads clearly.
 */
export function StepProgress({ total, current, ariaLabel, className = '' }: StepProgressProps) {
  return (
    <div
      className={['flex items-center gap-1.5', className].join(' ')}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={ariaLabel ?? `Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const stepNo = i + 1
        const done = stepNo < current
        const active = stepNo === current
        return (
          <span
            key={stepNo}
            className={[
              'h-1.5 flex-1 rounded-full transition-colors duration-300 ease-smooth',
              done || active ? 'bg-accent' : 'bg-border-subtle',
              active ? 'ring-2 ring-accent/30' : '',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}
