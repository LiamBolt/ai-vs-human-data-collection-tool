interface BrandLogoProps {
  /** Logo size in pixels (square). */
  size?: number
  /** Show the "AI vs the Brain" wordmark beside the mark. */
  withWordmark?: boolean
  /** Sub-label under the wordmark (e.g. "Proctor Console"). */
  subtitle?: string
  className?: string
}

/**
 * The product brand mark. The source PNG has a white background, so it sits on a
 * light "chip" that reads as an intentional logo badge in both light and dark themes.
 */
export function BrandLogo({ size = 40, withWordmark = false, subtitle, className = '' }: BrandLogoProps) {
  return (
    <div className={['inline-flex items-center gap-3', className].join(' ')}>
      <span
        className="inline-flex items-center justify-center rounded-card bg-white shadow-glass ring-1 ring-[var(--logo-ring)] shrink-0"
        style={{ width: size, height: size, padding: Math.round(size * 0.12) }}
      >
        <img
          src="/ai-human-logo.png"
          alt="AI vs the Brain"
          width={size}
          height={size}
          decoding="async"
          className="h-full w-full object-contain"
        />
      </span>

      {withWordmark && (
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-text-primary">AI vs the Brain</span>
          {subtitle && <span className="text-xs text-text-secondary">{subtitle}</span>}
        </span>
      )}
    </div>
  )
}
