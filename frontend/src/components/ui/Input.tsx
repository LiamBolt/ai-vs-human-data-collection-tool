import { forwardRef, useId } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  inputWidth?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      optional = false,
      inputWidth = 'w-full',
      className = '',
      id: idProp,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary leading-tight"
        >
          {label}
          {optional && (
            <span className="ml-1.5 text-text-disabled font-normal">(optional)</span>
          )}
        </label>

        {hint && (
          <p id={hintId} className="text-xs text-text-secondary leading-relaxed">
            {hint}
          </p>
        )}

        <input
          ref={ref}
          id={id}
          aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          autoComplete="off"
          spellCheck={false}
          className={[
            inputWidth,
            'rounded-input px-3 py-2.5',
            'text-base text-text-primary', // min 16px via text-base
            'bg-surface-card border',
            error
              ? 'border-error focus-visible:ring-error/40'
              : 'border-border-subtle focus-visible:ring-accent/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            'placeholder-transparent', // no placeholders per design rules
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].join(' ')}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-error leading-relaxed animate-[fadeIn_150ms_ease-in]"
          >
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
