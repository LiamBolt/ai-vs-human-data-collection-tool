import { useId } from 'react'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string | React.ReactNode
  hint?: string
  error?: string
}

export function Checkbox({ label, hint, error, id: idProp, className = '', ...props }: CheckboxProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={[
          'flex items-start gap-3',
          'min-h-[44px] p-3',
          'rounded-input border cursor-pointer',
          'transition-colors duration-200',
          'focus-within:ring-2 focus-within:ring-accent/40 focus-within:ring-offset-1 focus-within:ring-offset-background',
          props.checked
            ? 'bg-accent/10 border-accent'
            : 'bg-surface-card border-border-subtle hover:bg-surface-hover',
          className,
        ].join(' ')}
      >
        <input
          id={id}
          type="checkbox"
          aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          className={[
            'mt-0.5 shrink-0 w-4 h-4 accent-accent rounded',
            'focus:outline-none',
          ].join(' ')}
          {...props}
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm text-text-primary">{label}</span>
          {hint && (
            <span id={hintId} className="text-xs text-text-secondary">
              {hint}
            </span>
          )}
        </span>
      </label>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-error leading-relaxed">
          {error}
        </p>
      )}
    </div>
  )
}
