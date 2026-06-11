import { useId } from 'react'

export interface RadioOption {
  value: string
  label: string
  description?: string
}

interface RadioGroupProps {
  label: string
  hint?: string
  error?: string
  options: RadioOption[]
  value: string | null
  onChange: (value: string) => void
  variant?: 'default' | 'pills'
  optional?: boolean
  name?: string
}

export function RadioGroup({
  label,
  hint,
  error,
  options,
  value,
  onChange,
  variant = 'default',
  optional = false,
  name: nameProp,
}: RadioGroupProps) {
  const id = useId()
  const name = nameProp ?? id
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-text-primary leading-tight">
        {label}
        {optional && (
          <span className="ml-1.5 text-text-disabled font-normal">(optional)</span>
        )}
      </legend>

      {hint && (
        <p id={hintId} className="text-xs text-text-secondary leading-relaxed">
          {hint}
        </p>
      )}

      <div
        role="radiogroup"
        aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
        className={variant === 'pills' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2'}
      >
        {options.map((option) => {
          const optionId = `${id}-${option.value}`
          const isSelected = value === option.value

          if (variant === 'pills') {
            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={[
                  'flex items-center justify-center',
                  'min-h-[44px] min-w-[44px] px-4 py-2',
                  'rounded-input border text-sm font-medium cursor-pointer',
                  'transition-[background-color,border-color,color] duration-200',
                  'focus-within:ring-2 focus-within:ring-accent/40 focus-within:ring-offset-1 focus-within:ring-offset-background',
                  isSelected
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'bg-surface-card border-border-subtle text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                ].join(' ')}
              >
                <input
                  id={optionId}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onChange(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            )
          }

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={[
                'flex items-start gap-3',
                'min-h-[44px] px-3 py-2.5',
                'rounded-input border cursor-pointer',
                'transition-[background-color,border-color] duration-200',
                'focus-within:ring-2 focus-within:ring-accent/40 focus-within:ring-offset-1 focus-within:ring-offset-background',
                isSelected
                  ? 'bg-accent/10 border-accent'
                  : 'bg-surface-card border-border-subtle hover:bg-surface-hover',
              ].join(' ')}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className={[
                  'mt-0.5 shrink-0 w-4 h-4 accent-accent',
                  'focus:outline-none',
                ].join(' ')}
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm text-text-primary">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-text-secondary">{option.description}</span>
                )}
              </span>
            </label>
          )
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-error leading-relaxed">
          {error}
        </p>
      )}
    </fieldset>
  )
}
