import type { ParticipantStatus } from '@/types'

// Ordered task lists per session
export const SESSION1_TASKS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export const SESSION2_TASKS = ['A3', 'A4', 'B3', 'B4'] as const

export type S1TaskCode = (typeof SESSION1_TASKS)[number]
export type S2TaskCode = (typeof SESSION2_TASKS)[number]

export function resolveStepRoute(status: ParticipantStatus, step: string): string {
  switch (status) {
    case 'CHECKED_IN':
      return '/consent'
    case 'FORM0':
      if (step === 'waiting_assignment') return '/waiting'
      return '/form0'
    case 'SESSION1':
      if (step === 's1_intro') return '/s1/intro'
      if (step.startsWith('s1_task_')) return `/s1/task/${step.slice(8)}`
      if (step === 's1_scales') return '/s1/scales'
      return '/s1/intro'
    case 'BREAK':
      return '/break'
    case 'SESSION2':
      if (step === 's2_intro') return '/s2/intro'
      if (step.startsWith('s2_task_')) return `/s2/task/${step.slice(8)}`
      if (step === 's2_transfer') return '/s2/transfer'
      return '/s2/intro'
    case 'SCALES_S2':
      return '/s2/scales'
    case 'COMPLETED':
      return '/complete'
    case 'WITHDRAWN':
      return '/withdrawn'
    default:
      return '/'
  }
}

export function getNextTaskRoute(
  session: 1 | 2,
  currentTaskCode: string,
): string {
  if (session === 1) {
    const idx = SESSION1_TASKS.indexOf(currentTaskCode as S1TaskCode)
    if (idx === -1 || idx === SESSION1_TASKS.length - 1) return '/s1/scales'
    return `/s1/task/${SESSION1_TASKS[idx + 1]}`
  } else {
    const idx = SESSION2_TASKS.indexOf(currentTaskCode as S2TaskCode)
    if (idx === -1) return '/s2/transfer'
    if (currentTaskCode === 'B4') return '/s2/transfer'
    return `/s2/task/${SESSION2_TASKS[idx + 1]}`
  }
}

export function getTaskIndex(session: 1 | 2, taskCode: string): number {
  const list = session === 1 ? SESSION1_TASKS : SESSION2_TASKS
  return (list.indexOf(taskCode as never) ?? -1) + 1
}

export function getTotalTasks(session: 1 | 2): number {
  return session === 1 ? SESSION1_TASKS.length : SESSION2_TASKS.length
}
