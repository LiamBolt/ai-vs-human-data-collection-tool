import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'

// Participant pages
import WelcomePage from '@/pages/participant/WelcomePage'
import ConsentPage from '@/pages/participant/ConsentPage'
import Form0Page from '@/pages/participant/Form0Page'
import WaitingPage from '@/pages/participant/WaitingPage'
import Session1IntroPage from '@/pages/participant/Session1IntroPage'
import Session2IntroPage from '@/pages/participant/Session2IntroPage'
import TaskPage from '@/pages/participant/TaskPage'
import ScalesPage from '@/pages/participant/ScalesPage'
import BreakPage from '@/pages/participant/BreakPage'
import TransferPromptPage from '@/pages/participant/TransferPromptPage'
import CompletionPage from '@/pages/participant/CompletionPage'
import WithdrawnPage from '@/pages/participant/WithdrawnPage'

// Proctor pages
const ProctorLoginPage = lazy(() => import('@/pages/proctor/ProctorLoginPage'))
const ProctorLayout = lazy(() => import('@/pages/proctor/ProctorLayout'))
const BatchesPage = lazy(() => import('@/pages/proctor/BatchesPage'))
const CheckInPage = lazy(() => import('@/pages/proctor/CheckInPage'))
const MonitorPage = lazy(() => import('@/pages/proctor/MonitorPage'))
const DeviationsPage = lazy(() => import('@/pages/proctor/DeviationsPage'))
const Layer2Page = lazy(() => import('@/pages/proctor/Layer2Page'))
const ExportsPage = lazy(() => import('@/pages/proctor/ExportsPage'))
const StaffPage = lazy(() => import('@/pages/proctor/StaffPage'))

// Rater pages
const RaterLoginPage = lazy(() => import('@/pages/rater/RaterLoginPage'))
const RaterQueuePage = lazy(() => import('@/pages/rater/RaterQueuePage'))

// Auth guard for staff routes
function RequireAuth({ allowedRoles }: { allowedRoles: string[] }) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)

  if (!token || !role) return <Navigate to="/proctor/login" replace />
  if (!allowedRoles.includes(role)) return <Navigate to="/proctor/login" replace />
  return <Outlet />
}

function RaterRequireAuth() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  if (!token || role !== 'RATER') return <Navigate to="/rater/login" replace />
  return <Outlet />
}

export default function App() {
  // The task workspace owns the brightness control in its mobile bottom bar, so
  // hide this floating toggle on mobile while that screen is active (declutter).
  const floatingToggleHidden = useThemeStore((s) => s.floatingToggleHidden)

  return (
    <ErrorBoundary>
      {/* Accessibility: keyboard users can jump straight to the form/content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-input focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-contrast focus:shadow-glass"
      >
        Skip to content
      </a>
      {/* Global theme switch — sits in the top-right corner. On mobile it aligns
          into the fixed top bars (z-40: above bars, below modals/open drawers).
          Hidden on mobile when a screen provides its own brightness control. */}
      <ThemeToggle
        className={[
          'fixed top-2.5 right-3 z-40 lg:top-4 lg:right-4',
          floatingToggleHidden ? 'max-lg:hidden' : '',
        ].join(' ')}
      />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
          {/* ── Participant flow ────────────────────────────────────────────── */}
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <WelcomePage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/consent"
            element={
              <ErrorBoundary>
                <ConsentPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/form0"
            element={
              <ErrorBoundary>
                <Form0Page />
              </ErrorBoundary>
            }
          />
          <Route
            path="/waiting"
            element={
              <ErrorBoundary>
                <WaitingPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/s1/intro"
            element={
              <ErrorBoundary>
                <Session1IntroPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/s1/task/:taskCode"
            element={
              <ErrorBoundary>
                <TaskPage session={1} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/s1/scales"
            element={
              <ErrorBoundary>
                <ScalesPage session={1} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/break"
            element={
              <ErrorBoundary>
                <BreakPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/s2/intro"
            element={
              <ErrorBoundary>
                <Session2IntroPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/s2/task/:taskCode"
            element={
              <ErrorBoundary>
                <TaskPage session={2} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/s2/transfer"
            element={
              <ErrorBoundary>
                <TransferPromptPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/s2/scales"
            element={
              <ErrorBoundary>
                <ScalesPage session={2} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/complete"
            element={
              <ErrorBoundary>
                <CompletionPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/withdrawn"
            element={
              <ErrorBoundary>
                <WithdrawnPage />
              </ErrorBoundary>
            }
          />

          {/* ── Proctor login (unguarded) ──────────────────────────────────── */}
          <Route path="/proctor/login" element={<ProctorLoginPage />} />

          {/* ── Proctor routes (JWT-guarded, PROCTOR or ADMIN role) ────────── */}
          <Route element={<RequireAuth allowedRoles={['PROCTOR', 'ADMIN']} />}>
            <Route element={<ProctorLayout />}>
              <Route path="/proctor" element={<Navigate to="/proctor/batches" replace />} />
              <Route path="/proctor/batches" element={<BatchesPage />} />
              <Route path="/proctor/checkin" element={<CheckInPage />} />
              <Route path="/proctor/monitor" element={<MonitorPage />} />
              <Route path="/proctor/deviations" element={<DeviationsPage />} />
              <Route path="/proctor/layer2" element={<Layer2Page />} />
              <Route path="/proctor/exports" element={<ExportsPage />} />
              {/* Staff management is ADMIN-only (backend also enforces this) */}
              <Route element={<RequireAuth allowedRoles={['ADMIN']} />}>
                <Route path="/proctor/staff" element={<StaffPage />} />
              </Route>
            </Route>
          </Route>

          {/* ── Rater login (unguarded) ────────────────────────────────────── */}
          <Route path="/rater/login" element={<RaterLoginPage />} />

          {/* ── Rater routes (JWT-guarded, RATER role only) ────────────────── */}
          <Route element={<RaterRequireAuth />}>
            <Route path="/rater/queue" element={<RaterQueuePage />} />
            <Route path="/rater" element={<Navigate to="/rater/queue" replace />} />
          </Route>

          {/* ── Catch-all ─────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
