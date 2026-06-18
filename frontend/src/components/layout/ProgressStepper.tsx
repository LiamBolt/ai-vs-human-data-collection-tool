import { SyncIndicator } from '@/components/ui/SyncIndicator'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { StepProgress } from '@/components/ui/StepProgress'

interface ProgressStepperProps {
  session: 1 | 2
  taskIndex: number
  totalTasks: number
  taskCode: string
  taskFamily: string
}

/**
 * Sticky task header. The brand, session, task counter and divided progress bar
 * stay pinned to the top while the participant scrolls the form, so they always
 * see where they are. The label is laid out on two compact lines so it fits a
 * 360px phone without clipping words.
 */
export function ProgressStepper({
  session,
  taskIndex,
  totalTasks,
  taskCode,
  taskFamily,
}: ProgressStepperProps) {
  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 pt-3 pb-3 mb-5 bg-background/90 backdrop-blur-md border-b border-border-subtle">
      <div className="flex items-center gap-2.5">
        <BrandLogo size={24} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary leading-tight">Session {session}</p>
          <p className="text-xs text-text-secondary leading-tight truncate">
            Task {taskIndex} of {totalTasks} · {taskCode} {taskFamily}
          </p>
        </div>
        <SyncIndicator />
      </div>

      <StepProgress
        total={totalTasks}
        current={taskIndex}
        ariaLabel={`Task ${taskIndex} of ${totalTasks}`}
        className="mt-2.5"
      />
    </div>
  )
}
