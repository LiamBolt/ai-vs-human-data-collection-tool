import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { BrandLogo } from '@/components/ui/BrandLogo'

const NAV_ITEMS = [
  { to: '/proctor/batches', label: 'Batches' },
  { to: '/proctor/checkin', label: 'Check-in' },
  { to: '/proctor/monitor', label: 'Monitor' },
  { to: '/proctor/deviations', label: 'Deviations' },
  { to: '/proctor/layer2', label: 'Layer 2' },
  { to: '/proctor/exports', label: 'Exports' },
]

// ADMIN-only nav entries appended when the signed-in staff is an admin.
const ADMIN_NAV_ITEMS = [{ to: '/proctor/staff', label: 'Staff' }]

export default function ProctorLayout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const displayCode = useAuthStore((s) => s.display_code)
  const role = useAuthStore((s) => s.role)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSignOut = () => {
    clearAuth()
    navigate('/proctor/login', { replace: true })
  }

  const navItems = [...NAV_ITEMS, ...(role === 'ADMIN' ? ADMIN_NAV_ITEMS : [])]

  // Shared nav body — reused by the desktop sidebar and the mobile drawer.
  const navBody = (
    <>
      <div className="px-5 py-5 border-b border-border-subtle">
        <BrandLogo size={36} withWordmark subtitle="Proctor Console" />
      </div>

      <div className="flex-1 py-4 flex flex-col gap-0.5 px-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              [
                'flex items-center min-h-[44px] px-3 py-2 rounded-input text-sm transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-border-subtle flex flex-col gap-2">
        <p className="text-xs text-text-disabled">
          {role} · {displayCode}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs text-text-disabled hover:text-text-primary text-left transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
        >
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar (≥ lg) */}
      <nav className="hidden lg:flex w-56 shrink-0 bg-surface-card border-r border-border-subtle flex-col">
        {navBody}
      </nav>

      {/* Mobile top bar (< lg) */}
      <header className="lg:hidden fixed inset-x-0 top-0 z-30 flex items-center justify-between h-14 px-4 bg-surface-card border-b border-border-subtle">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 rounded-input text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <BrandLogo size={28} withWordmark />
        <span className="min-w-[44px]" aria-hidden="true" />
      </header>

      {/* Mobile drawer + backdrop (< lg) */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <nav className="absolute inset-y-0 left-0 w-64 max-w-[80%] bg-surface-card border-r border-border-subtle flex flex-col shadow-glass animate-[fadeIn_200ms_ease-out]">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-3 right-3 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-input text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {navBody}
          </nav>
        </div>
      )}

      {/* Main area — offset below the fixed top bar on mobile only */}
      <main className="flex-1 overflow-y-auto bg-background pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
