import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from './mswServer'
import WelcomePage from '@/pages/participant/WelcomePage'
import { useSessionStore } from '@/store/session'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function makeQC() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeQC()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function idInput() {
  // The Input carries an explicit aria-label, so target that to avoid ambiguity
  return screen.getByLabelText(/enter your participant id/i)
}

describe('WelcomePage — resume rehydration', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    localStorage.clear()
    useSessionStore.setState({ participant_code: null, status: null, current_step: null })
  })

  it('routes to /s1/task/A1 when the server reports that step', async () => {
    server.use(
      http.post('/api/v1/session/resume', () =>
        HttpResponse.json({
          participant_code: 'TEST-001',
          status: 'SESSION1',
          current_step: 's1_task_A1',
          group_assignment: 'CONTROL',
          current_session: 1,
          draft_responses: {},
          break_ends_at: null,
          current_task: 'A1',
        }),
      ),
    )

    const user = userEvent.setup()
    render(<WelcomePage />, { wrapper: Wrapper })

    await user.clear(idInput())
    await user.type(idInput(), 'TEST-001')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled(), { timeout: 3000 })
    expect(mockNavigate.mock.calls[0][0]).toBe('/s1/task/A1')
  })

  it('routes to /break when the participant is on break', async () => {
    server.use(
      http.post('/api/v1/session/resume', () =>
        HttpResponse.json({
          participant_code: 'TEST-002',
          status: 'BREAK',
          current_step: 'break',
          group_assignment: 'AI_ASSISTED',
          current_session: 1,
          draft_responses: {},
          break_ends_at: new Date(Date.now() + 60000).toISOString(),
          current_task: null,
        }),
      ),
    )

    const user = userEvent.setup()
    render(<WelcomePage />, { wrapper: Wrapper })

    await user.clear(idInput())
    await user.type(idInput(), 'TEST-002')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled(), { timeout: 3000 })
    expect(mockNavigate.mock.calls[0][0]).toBe('/break')
  })

  it('shows an error when the participant is not found', async () => {
    server.use(
      http.post('/api/v1/session/resume', () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Participant not found' } },
          { status: 404 },
        ),
      ),
    )

    const user = userEvent.setup()
    render(<WelcomePage />, { wrapper: Wrapper })

    await user.clear(idInput())
    await user.type(idInput(), 'BAD')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText(/not found/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
