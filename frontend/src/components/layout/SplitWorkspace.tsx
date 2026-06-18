import { useEffect, useState } from 'react'
import { useThemeStore } from '@/store/theme'

interface SplitWorkspaceProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  /** Label for the context tab in the mobile bottom bar. */
  contextLabel?: string
}

type MobileView = 'task' | 'context'

interface TabButtonProps {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}

function TabButton({ active, onClick, label, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] px-2',
        'text-[11px] font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40',
        active ? 'text-accent' : 'text-text-secondary hover:text-text-primary',
      ].join(' ')}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

/**
 * Two-pane workspace. On desktop the context (question, rules, assistance) sits
 * in a sticky left rail beside the form. On mobile it becomes one screen at a
 * time, switched from a fixed bottom tab bar (Your work · Question & hints ·
 * Brightness) so nothing is stacked or floating over the form.
 */
export function SplitWorkspace({ leftPanel, rightPanel, contextLabel = 'Question & hints' }: SplitWorkspaceProps) {
  const [view, setView] = useState<MobileView>('task')
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const setFloatingToggleMode = useThemeStore((s) => s.setFloatingToggleMode)
  const isDark = theme === 'dark'

  // The bottom bar owns brightness on mobile → hide the floating toggle on mobile
  // only (desktop keeps it) while this workspace is mounted.
  useEffect(() => {
    setFloatingToggleMode('hide-mobile')
    return () => setFloatingToggleMode('show')
  }, [setFloatingToggleMode])

  return (
    <>
      {/* Desktop split layout */}
      <div className="hidden lg:flex min-h-screen">
        <aside className="w-[40%] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-border-subtle bg-background">
          <div className="p-6 h-full">{leftPanel}</div>
        </aside>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6">{rightPanel}</div>
        </main>
      </div>

      {/* Mobile: one screen at a time, switched from the bottom tab bar.
          The body scrolls (no overflow container here) so the task header's
          `sticky top-0` pins to the viewport instead of being trapped in — and
          scrolled away with — an inner scroll box. */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <main className="flex-1 pb-28">
          {view === 'task' ? (
            <div key="task" className="px-4 py-5 animate-[fadeIn_180ms_ease-out]">
              {rightPanel}
            </div>
          ) : (
            <div key="context" className="px-4 py-5 flex flex-col gap-5 animate-[fadeIn_180ms_ease-out]">
              {leftPanel}
              <button
                type="button"
                onClick={() => setView('task')}
                className="mt-1 w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-input bg-accent text-accent-contrast font-semibold hover:bg-accent-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Continue to your work
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          )}
        </main>

        {/* Fixed bottom tab bar */}
        <nav
          aria-label="Workspace"
          className="fixed bottom-0 inset-x-0 z-40 flex items-stretch bg-surface-card border-t border-border-subtle"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <TabButton active={view === 'task'} onClick={() => setView('task')} label="Your work">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </TabButton>

          <TabButton active={view === 'context'} onClick={() => setView('context')} label={contextLabel}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </TabButton>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] px-2 text-[11px] font-medium text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
          >
            {isDark ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
            <span>Brightness</span>
          </button>
        </nav>
      </div>
    </>
  )
}
