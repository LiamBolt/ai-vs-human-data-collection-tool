import { useState } from 'react'

interface SplitWorkspaceProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  contextSummary?: string
}

export function SplitWorkspace({ leftPanel, rightPanel, contextSummary }: SplitWorkspaceProps) {
  const [contextExpanded, setContextExpanded] = useState(false)

  return (
    <>
      {/* Desktop split layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left panel — fixed 40%, sticky */}
        <aside className="w-[40%] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-border-subtle bg-background">
          <div className="p-6 h-full">
            {leftPanel}
          </div>
        </aside>

        {/* Right panel — scrollable 60% */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6">
            {rightPanel}
          </div>
        </main>
      </div>

      {/* Mobile/tablet stacked layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Sticky context summary bar */}
        <div className="sticky top-0 z-10 bg-surface-card border-b border-border-subtle">
          <button
            type="button"
            onClick={() => setContextExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-expanded={contextExpanded}
          >
            <span className="text-sm font-medium text-text-primary truncate pr-4">
              {contextSummary ?? 'View question'}
            </span>
            <svg
              className={[
                'w-4 h-4 shrink-0 text-text-secondary transition-transform duration-200',
                contextExpanded ? 'rotate-180' : '',
              ].join(' ')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {contextExpanded && (
            <div className="px-4 pb-4 border-t border-border-subtle">
              {leftPanel}
            </div>
          )}
        </div>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-5">
            {rightPanel}
          </div>
        </main>
      </div>
    </>
  )
}
