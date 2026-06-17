import { useSessionStore } from '@/store/session'

export function SyncIndicator() {
  const syncStatus = useSessionStore((s) => s.sync_status)

  if (syncStatus === 'offline') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-warning" role="status" aria-live="polite">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Working offline · will retry</span>
      </div>
    )
  }

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-text-disabled" role="status" aria-live="polite">
        <svg className="w-3.5 h-3.5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Syncing…</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-text-disabled" role="status" aria-live="polite">
      <svg className="w-3.5 h-3.5 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
      <span>Draft saved automatically</span>
    </div>
  )
}
