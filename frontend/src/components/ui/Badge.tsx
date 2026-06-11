import type { ParticipantStatus } from '@/types'

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-hover text-text-secondary',
  info:    'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error:   'bg-error/15 text-error',
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

const statusVariants: Record<ParticipantStatus, BadgeVariant> = {
  CHECKED_IN: 'neutral',
  FORM0:      'info',
  SESSION1:   'info',
  BREAK:      'warning',
  SESSION2:   'info',
  SCALES_S2:  'info',
  COMPLETED:  'success',
  WITHDRAWN:  'error',
}

const statusLabels: Record<ParticipantStatus, string> = {
  CHECKED_IN: 'Checked in',
  FORM0:      'Form 0',
  SESSION1:   'Session 1',
  BREAK:      'Break',
  SESSION2:   'Session 2',
  SCALES_S2:  'Post-session scales',
  COMPLETED:  'Completed',
  WITHDRAWN:  'Withdrawn',
}

export function StatusBadge({ status }: { status: ParticipantStatus }) {
  return (
    <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
  )
}
