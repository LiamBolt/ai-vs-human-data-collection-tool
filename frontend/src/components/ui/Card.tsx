interface CardProps {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

export function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={[
        'rounded-card glass-panel',
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  )
}

interface CardSectionProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardSectionProps) {
  return (
    <div className={['px-5 py-4 border-b border-glass-border', className].join(' ')}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardSectionProps) {
  return (
    <div className={['px-5 py-4', className].join(' ')}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: CardSectionProps) {
  return (
    <div className={['px-5 py-4 border-t border-glass-border', className].join(' ')}>
      {children}
    </div>
  )
}
