export type TrendDir = 'up' | 'down' | 'neutral';

export type DORALevel = 'Elite' | 'High' | 'Med' | 'Low';

export type ItemStatus = 'On track' | 'At risk' | 'Blocked' | 'Done' | 'Open';

export type TimeRange = '7d' | '14d' | '30d' | '90d';

export type TeamName =
  | 'Platform'
  | 'Backend'
  | 'Frontend'
  | 'Mobile'
  | 'Data'
  | string;

export type RepoName =
  | 'monorepo'
  | 'api-gateway'
  | 'frontend-app'
  | 'mobile-app'
  | 'data-pipeline'
  | 'auth-service'
  | string;
