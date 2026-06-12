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

  const handleSignOut = () => {
    clearAuth()
    navigate('/proctor/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar nav */}
      <nav className="w-56 shrink-0 bg-surface-card border-r border-border-subtle flex flex-col">
        <div className="px-5 py-5 border-b border-border-subtle">
          <BrandLogo size={36} withWordmark subtitle="Proctor Console" />
        </div>

        <div className="flex-1 py-4 flex flex-col gap-0.5 px-3">
          {[...NAV_ITEMS, ...(role === 'ADMIN' ? ADMIN_NAV_ITEMS : [])].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center px-3 py-2 rounded-input text-sm transition-colors duration-150',
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
      </nav>

      {/* Main area */}
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  )
}
