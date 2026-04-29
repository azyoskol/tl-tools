import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TeamComparison } from '../../src/components/TeamComparison'

vi.mock('../../src/api/client', () => ({
  api: {
    getTeamsComparison: vi.fn().mockResolvedValue({
      data: [{ team_id: 'team-1', prs: 10, tasks: 5, ci_runs: 20 }],
    }),
  },
}))

describe('TeamComparison', () => {
  it('renders with toggle', async () => {
    render(<TeamComparison />)
    await waitFor(
      () => {
        expect(screen.getByText('Chart')).toBeInTheDocument()
        expect(screen.getByText('Table')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })
})