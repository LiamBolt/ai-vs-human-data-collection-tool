import { useId } from 'react'

interface ConfidenceRatingProps {
  value: number | null
  onChange: (value: number) => void
  error?: string
}

const LABELS: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Very high',
}

export function ConfidenceRating({ value, onChange, error }: ConfidenceRatingProps) {
  const groupId = useId()
  const errorId = `${groupId}-error`

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-text-primary">Confidence rating</legend>

      <div
        role="radiogroup"
        aria-label="Confidence rating 1 to 5"
        aria-describedby={error ? errorId : undefined}
        className="flex flex-wrap gap-2"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const isSelected = value === n
          const optId = `${groupId}-${n}`
          return (
            <label
              key={n}
              htmlFor={optId}
              title={LABELS[n]}
              className={[
                'flex flex-col items-center justify-center',
                'min-h-[44px] min-w-[44px] w-12 px-2 py-2',
                'rounded-input border text-sm font-semibold cursor-pointer',
                'transition-[background-color,border-color,color] duration-200',
                'focus-within:ring-2 focus-within:ring-accent/40 focus-within:ring-offset-1 focus-within:ring-offset-background',
                isSelected
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-surface-card border-border-subtle text-text-secondary hover:bg-surface-hover hover:text-text-primary',
              ].join(' ')}
            >
              <input
                id={optId}
                type="radio"
                name={groupId}
                value={String(n)}
                checked={isSelected}
                onChange={() => onChange(n)}
                className="sr-only"
              />
              {n}
            </label>
          )
        })}
      </div>

      <div className="flex justify-between text-xs text-text-disabled px-1">
        <span>Strongly disagree</span>
        <span>Strongly agree</span>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}
