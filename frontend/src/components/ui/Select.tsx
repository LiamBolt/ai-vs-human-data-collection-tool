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
 * focus, a 44px touch target, and a full-width control by default. The open list
 * is themed via global `select option` rules in index.css so it no longer drops
 * to the bare OS palette. When no value is chosen the trigger shows muted
 * "placeholder" text; a real selection reads in full-strength primary text.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, optional = false, className = '', id: idProp, children, value, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    // Empty value → render the trigger like a placeholder (muted), matching the
    // no-placeholder, label-driven form language used elsewhere.
    const isPlaceholder = value === '' || value === undefined || value === null

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

        <div className="relative group">
          <select
            ref={ref}
            id={id}
            value={value}
            aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
            aria-invalid={error ? 'true' : undefined}
            className={[
              'w-full min-h-[44px] appearance-none',
              'rounded-input pl-3.5 pr-11 py-2.5',
              'text-base', // min 16px → no iOS zoom on focus
              isPlaceholder ? 'text-text-disabled font-normal' : 'text-text-primary font-medium',
              'bg-surface-card border',
              error
                ? 'border-error focus-visible:ring-error/40'
                : 'border-border-subtle hover:border-text-disabled focus-visible:ring-accent/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
              className,
            ].join(' ')}
            {...props}
          >
            {children}
          </select>

          {/* Custom chevron in a subtle chip (the native arrow is hidden via
              appearance-none). The chip tints toward the accent on hover/focus
              so the control reads as interactive rather than bare. */}
          <span
            aria-hidden="true"
            className={[
              'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2',
              'flex h-7 w-7 items-center justify-center rounded-md',
              'text-text-secondary transition-colors duration-150',
              'group-hover:bg-surface-hover group-hover:text-text-primary',
              'group-focus-within:bg-accent/10 group-focus-within:text-accent',
            ].join(' ')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
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
