import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { AssistancePanel } from '@/components/participant/AssistancePanel'
import { useSessionStore } from '@/store/session'

function makeQC() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function renderPanel() {
  const qc = makeQC()
  return render(
    <QueryClientProvider client={qc}>
      <AssistancePanel taskCode="A1" participantCode="TEST-001" />
    </QueryClientProvider>,
  )
}

describe('AssistancePanel sequential unlock', () => {
  beforeEach(() => {
    useSessionStore.setState({ participant_code: 'TEST-001', hint_state: {} })
  })

  it('renders the three assistance levels', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /Level 1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Level 2/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Level 3/i })).toBeInTheDocument()
  })

  it('locks Level 2 until Level 1 is unlocked', async () => {
    const user = userEvent.setup()
    renderPanel()

    expect(screen.getByRole('button', { name: /Level 2/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Level 1/i }))

    await waitFor(
      () => expect(screen.getByRole('button', { name: /Level 2/i })).not.toBeDisabled(),
      { timeout: 2000 },
    )
  })

  it('locks Level 3 until Level 2 is unlocked', async () => {
    const user = userEvent.setup()
    renderPanel()

    expect(screen.getByRole('button', { name: /Level 3/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Level 1/i }))
    await waitFor(
      () => expect(screen.getByRole('button', { name: /Level 2/i })).not.toBeDisabled(),
      { timeout: 2000 },
    )

    // Still locked after only Level 1 is open
    expect(screen.getByRole('button', { name: /Level 3/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Level 2/i }))
    await waitFor(
      () => expect(screen.getByRole('button', { name: /Level 3/i })).not.toBeDisabled(),
      { timeout: 2000 },
    )
  })

  it('reveals the verbatim hint text after unlocking a level', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: /Level 1/i }))
    await waitFor(
      () => expect(screen.getByText(/Multiply price×quantity then add\./i)).toBeInTheDocument(),
      { timeout: 2000 },
    )
  })
})
