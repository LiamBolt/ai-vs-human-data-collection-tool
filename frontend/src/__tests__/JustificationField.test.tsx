import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JustificationField } from '@/components/participant/JustificationField'
import { useSessionStore } from '@/store/session'

function resetStore() {
  useSessionStore.setState({ participant_code: 'TEST', draft_answers: {} })
}

function draftValue(): string {
  return (useSessionStore.getState().getDraftForTask('A1').justification as string | undefined) ?? ''
}

describe('JustificationField', () => {
  beforeEach(resetStore)

  it('writes typed text into the session draft store', async () => {
    const user = userEvent.setup()
    render(<JustificationField taskCode="A1" prompt="Explain your reasoning." />)

    await user.type(screen.getByRole('textbox'), 'Hello world')
    expect(draftValue()).toBe('Hello world')
  })

  it('shows a live counter and stays under the minimum below 30 trimmed chars', async () => {
    const user = userEvent.setup()
    render(<JustificationField taskCode="A1" prompt="Explain." />)

    await user.type(screen.getByRole('textbox'), 'Too short') // 9 chars
    expect(screen.getByText(/9 \/ 30 minimum/)).toBeInTheDocument()
    expect(draftValue().trim().length).toBeLessThan(30)
  })

  it('reaches the 30-char minimum once enough is typed', async () => {
    const user = userEvent.setup()
    render(<JustificationField taskCode="A1" prompt="Explain." />)

    const text = 'This justification is well over thirty characters long.'
    await user.type(screen.getByRole('textbox'), text)

    expect(draftValue().trim().length).toBeGreaterThanOrEqual(30)
    expect(screen.getByText(new RegExp(`${text.trim().length} / 30 minimum`))).toBeInTheDocument()
  })

  it('treats whitespace-only input as not meeting the minimum', async () => {
    const user = userEvent.setup()
    render(<JustificationField taskCode="A1" prompt="Explain." />)

    await user.type(screen.getByRole('textbox'), '          ') // 10 spaces
    expect(draftValue().trim().length).toBe(0)
    expect(screen.getByText(/0 \/ 30 minimum/)).toBeInTheDocument()
  })
})
