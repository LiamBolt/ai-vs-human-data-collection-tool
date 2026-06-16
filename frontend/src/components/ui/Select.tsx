import { forwardRef, useId } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Visible, top-aligned label. Omit to render the control on its own. */
  label?: string
  hint?: string
  error?: string
  optional?: boolean
}

/**
 * Native select styled to match {@link Input}. Uses the OS-native picker (best
 * on mobile) while keeping a 16px font so iOS Safari never zooms the viewport on
 * focus, a 44px touch target, and a full-width control by default. A custom
 * chevron replaces the platform arrow for visual consistency.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, optional = false, className = '', id: idProp, children, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-primary leading-tight">
            {label}
            {optional && (
              <span className="ml-1.5 text-text-disabled font-normal">(optional)</span>
            )}
          </label>
        )}

        {hint && (
          <p id={hintId} className="text-xs text-text-secondary leading-relaxed">
            {hint}
          </p>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
            aria-invalid={error ? 'true' : undefined}
            className={[
              'w-full min-h-[44px] appearance-none',
              'rounded-input pl-3 pr-10 py-2.5',
              'text-base text-text-primary', // min 16px → no iOS zoom on focus
              'bg-surface-card border',
              error
                ? 'border-error focus-visible:ring-error/40'
                : 'border-border-subtle focus-visible:ring-accent/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
              className,
            ].join(' ')}
            {...props}
          >
            {children}
          </select>

          {/* Custom chevron (the native arrow is hidden via appearance-none) */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
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

Select.displayName = 'Select'
