import { Card, CardBody } from '@/components/ui/Card'

interface ContextPanelProps {
  stepTitle: string
  taskCode: string
  taskFamily: string
  question: string
  sessionRules: string
  assistancePanel?: React.ReactNode
}

export function ContextPanel({
  stepTitle,
  taskCode,
  taskFamily,
  question,
  sessionRules,
  assistancePanel,
}: ContextPanelProps) {
  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-text-disabled">
          {stepTitle}
        </p>
        <p className="text-xs text-text-secondary">
          {taskCode} · {taskFamily}
        </p>
      </div>

      <Card>
        <CardBody>
          <p className="text-sm font-medium text-text-primary leading-relaxed">
            {question}
          </p>
        </CardBody>
      </Card>

      <div className="rounded-card border border-border-subtle bg-surface-card/50 px-4 py-3">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider mb-2">
          Session rules
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">{sessionRules}</p>
      </div>

      {assistancePanel && (
        <div className="flex-1">
          {assistancePanel}
        </div>
      )}
    </div>
  )
}
