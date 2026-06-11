interface FormShellProps {
  /** Small uppercase label above the title (e.g. "Participant access"). */
  eyebrow?: string
  title?: string
  subtitle?: string
  children: React.ReactNode
  /** Optional footer content, separated by a hairline divider. */
  footer?: React.ReactNode
  className?: string
  /** Tailwind max-width utility for the shell. Defaults to a single-column form width. */
  maxWidth?: string
}

/**
 * A glassmorphic, clearly-bordered container that frames a form so it reads as a
 * distinct, professional region. The accent hairline along the top edge plus the
 * glass border give the form an unmistakable boundary.
 */
export function FormShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  className = '',
  maxWidth = 'max-w-md',
}: FormShellProps) {
  const hasHeader = Boolean(eyebrow || title || subtitle)

  return (
    <section
      className={[
        'relative w-full overflow-hidden',
        maxWidth,
        'glass-panel-strong rounded-modal',
        'px-6 py-7 sm:px-8 sm:py-9',
        'flex flex-col gap-6',
        className,
      ].join(' ')}
    >
      {/* Accent hairline marking the top of the form region */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-70"
      />

      {hasHeader && (
        <header className="flex flex-col gap-1.5">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wider text-accent">{eyebrow}</p>
          )}
          {title && (
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">{title}</h1>
          )}
          {subtitle && (
            <p className="text-sm text-text-secondary leading-relaxed">{subtitle}</p>
          )}
        </header>
      )}

      <div className="flex flex-col gap-5">{children}</div>

      {footer && (
        <footer className="border-t border-glass-border pt-4 text-sm text-text-secondary">
          {footer}
        </footer>
      )}
    </section>
  )
}
