import { forwardRef, useId, useState } from 'react'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  inputWidth?: string
}

/**
 * Password field with an inline show/hide toggle. The toggle is a text button
 * (not a decorative icon) so it stays accessible and within the design system,
 * with a full-height 44px touch target and a focus-visible ring.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, inputWidth = 'w-full', className = '', id: idProp, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`
    const [visible, setVisible] = useState(false)

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-text-primary leading-tight">
          {label}
        </label>

        <div className={['relative', inputWidth].join(' ')}>
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? 'true' : undefined}
            autoComplete="current-password"
            spellCheck={false}
            className={[
              'w-full rounded-input pl-3 pr-20 py-2.5',
              'text-base text-text-primary', // min 16px via text-base
              'bg-surface-card border',
              error
                ? 'border-error focus-visible:ring-error/40'
                : 'border-border-subtle focus-visible:ring-accent/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              'placeholder-transparent',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className,
            ].join(' ')}
            {...props}
          />

          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 my-px mr-px px-4 inline-flex items-center justify-center rounded-input text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors duration-150"
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-xs text-error leading-relaxed animate-[fadeIn_150ms_ease-in]">
            {error}
          </p>
        )}
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
