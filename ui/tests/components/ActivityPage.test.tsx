import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ActivityPage } from '../../src/components/ActivityPage'

vi.mock('../../src/api/client', () => ({
  api: {
    getActivityWithFilters: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}))

describe('ActivityPage', () => {
  it('renders with filters', async () => {
    render(<ActivityPage teamId="test-id" />)
    await waitFor(
      () => {
        expect(screen.getByText('All Sources')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })
})