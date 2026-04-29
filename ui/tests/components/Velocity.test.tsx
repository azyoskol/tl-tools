import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Velocity } from '../../src/components/Velocity'

vi.mock('../../src/api/client', () => ({
  api: {
    getVelocity: vi.fn()
      .mockResolvedValueOnce({ data: null })  
      .mockResolvedValueOnce({ data: null }),
  },
}))

describe('Velocity', () => {
  it('renders loading state', async () => {
    render(<Velocity teamId="test-id" />)
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  it('renders no data state', async () => {
    render(<Velocity teamId="test-id" />)
    await waitFor(
      () => {
        expect(screen.getByText(/no velocity data/i)).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })
})