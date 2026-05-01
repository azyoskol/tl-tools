import { ActivityEvent } from './api';

export interface CurrentUser {
  id: string;
  displayName: string;
  initials: string;
  role: string;
  avatarUrl?: string;
}

export interface SystemStatus {
  status: 'nominal' | 'degraded' | 'down';
  label: string;
}

export interface MeResponse {
  user: CurrentUser;
  system: SystemStatus;
  pinnedDashboardIds: string[];
  dashboards: DashboardIndexEntry[];
}

export interface ActivityEvent {
  id: string;
  actor: string;
  description: string;
  relativeTime: string;
  color: string;
}
