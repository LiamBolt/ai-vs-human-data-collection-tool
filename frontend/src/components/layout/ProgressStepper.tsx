import { SyncIndicator } from '@/components/ui/SyncIndicator'

interface ProgressStepperProps {
  session: 1 | 2
  taskIndex: number
  totalTasks: number
  taskCode: string
  taskFamily: string
}

export function ProgressStepper({
  session,
  taskIndex,
  totalTasks,
  taskCode,
  taskFamily,
}: ProgressStepperProps) {
  const progressPct = (taskIndex / totalTasks) * 100

  return (
    <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm pb-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-text-secondary">
          <span className="text-text-primary font-medium">Session {session}</span>
          {' · '}
          Task {taskIndex} of {totalTasks}
          {' — '}
          <span className="text-text-secondary">{taskCode} {taskFamily}</span>
        </p>
        <SyncIndicator />
      </div>

      <div
        className="h-0.5 w-full bg-border-subtle rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={taskIndex}
        aria-valuemin={0}
        aria-valuemax={totalTasks}
        aria-label={`Task ${taskIndex} of ${totalTasks}`}
      >
        <div
          className="h-full bg-accent rounded-full transition-[width] duration-enter ease-smooth"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
