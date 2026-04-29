export const CHART_COLORS = [
  '#88b4d8', '#82ca9d', '#ffc658', '#ff8042',
  '#00b8FE', '#00C49F', '#FFBB28', '#FF8b42'
]

export const EVENT_TYPES = {
  PUSH: 'push',
  PR_OPENED: 'pr_opened',
  PR_MERGED: 'pr_merged',
  PR_CLOSED: 'pr_closed',
  ISSUE_OPENED: 'issue_opened',
  ISSUE_CLOSED: 'issue_closed',
} as const
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export const TIME_PERIODS = {
  DAY: 1,
  WEEK: 7,
  MONTH: 30,
  QUARTER: 90,
  YEAR: 365,
} as const

export const DEFAULT_TEAM_ID = 'all'
export const LOADING_MESSAGE = 'Loading data...'