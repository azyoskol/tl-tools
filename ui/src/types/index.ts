export interface Team {
  id: string
  name: string
}

export interface OverviewMetrics {
  prs_awaiting_review: number
  blocked_tasks: number
  ci_failures_last_hour: number
}

export interface ActivityItem {
  date: string
  source: 'git' | 'pm' | 'cicd'
  event: string
  count: number
}

export interface HourlyActivity {
  hour: number
  count: number
}

export interface TopTeam {
  team_id: string
  source: string
  count: number
}

export interface DashboardData {
  overview: OverviewMetrics
  activity: ActivityItem[]
  top_teams: TopTeam[]
  hourly: HourlyActivity[]
  top_authors: { author: string; count: number }[]
}

export interface VelocityData {
  team_id: string
  velocity: { date: string; tasks: number }[]
  cycle_time: { date: string; type: string; count: number }[]
  lead_time: { date: string; count: number }[]
}

export interface TeamComparisonData {
  team_id: string
  prs: number
  tasks: number
  ci_runs: number
}

export interface ActivityFilters {
  from?: string
  to?: string
  source?: string
}

export interface ActivityPageData {
  team_id: string
  data: ActivityItem[]
  filters: ActivityFilters
}