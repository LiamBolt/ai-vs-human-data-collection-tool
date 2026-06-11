import { forwardRef, useId, useState } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  minChars?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      optional = false,
      minChars,
      className = '',
      id: idProp,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const [charCount, setCharCount] = useState(() => {
      const initial = String(value ?? defaultValue ?? '')
      return initial.trim().length
    })

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.trim().length)
      onChange?.(e)
    }

    const counterMet = minChars ? charCount >= minChars : true

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

        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
            aria-invalid={error ? 'true' : undefined}
            autoComplete="off"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            rows={5}
            className={[
              'w-full rounded-input px-3 py-2.5 pb-7',
              'text-base text-text-primary resize-y',
              'bg-surface-card border',
              error
                ? 'border-error focus-visible:ring-error/40'
                : 'border-border-subtle focus-visible:ring-accent/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className,
            ].join(' ')}
            {...props}
          />

          {minChars !== undefined && (
            <span
              className={[
                'absolute bottom-2.5 right-3 text-xs tabular-nums pointer-events-none',
                'transition-colors duration-200',
                counterMet ? 'text-text-primary' : 'text-text-disabled',
              ].join(' ')}
              aria-live="polite"
              aria-label={`${charCount} of ${minChars} minimum characters`}
            >
              {charCount} / {minChars} minimum
            </span>
          )}
        </div>

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

Textarea.displayName = 'Textarea'
