import '@testing-library/jest-dom'
import { vi } from 'vitest'

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.mock('../src/api/client', () => ({
  api: {
    getVelocity: vi.fn().mockResolvedValue({
      data: {
        team_id: 'test-id',
        velocity: [],
        cycle_time: [],
        lead_time: [],
      },
    }),
    getTeamsComparison: vi.fn().mockResolvedValue({
      data: [{ team_id: 'team-1', prs: 10, tasks: 5, ci_runs: 20 }],
    }),
    getActivityWithFilters: vi.fn().mockResolvedValue({
      data: { data: [{ date: '2024-01-01', source: 'git', event: 'push', count: 1 }] },
    }),
  },
}))