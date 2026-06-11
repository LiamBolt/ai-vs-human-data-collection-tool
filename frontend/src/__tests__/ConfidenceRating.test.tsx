import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfidenceRating } from '@/components/participant/ConfidenceRating'

describe('ConfidenceRating', () => {
  it('renders 5 radio options', () => {
    render(<ConfidenceRating value={null} onChange={vi.fn()} />)
    expect(screen.getAllByRole('radio')).toHaveLength(5)
  })

  it('calls onChange with the chosen value when a pill is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ConfidenceRating value={null} onChange={onChange} />)

    await user.click(screen.getByDisplayValue('3'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('supports keyboard activation: Tab to focus, Space to select', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ConfidenceRating value={null} onChange={onChange} />)

    await user.tab()
    expect(document.activeElement).toBe(screen.getByDisplayValue('1'))

    await user.keyboard(' ')
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('shows the disagree/agree anchors', () => {
    render(<ConfidenceRating value={null} onChange={vi.fn()} />)
    expect(screen.getByText(/strongly disagree/i)).toBeInTheDocument()
    expect(screen.getByText(/strongly agree/i)).toBeInTheDocument()
  })

  it('reflects the selected value in the checked state', () => {
    render(<ConfidenceRating value={3} onChange={vi.fn()} />)
    expect((screen.getByDisplayValue('3') as HTMLInputElement).checked).toBe(true)
    ;[1, 2, 4, 5].forEach((v) => {
      expect((screen.getByDisplayValue(String(v)) as HTMLInputElement).checked).toBe(false)
    })
  })
})
