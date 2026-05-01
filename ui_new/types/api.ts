import { TimeRange, TeamName, RepoName } from './common';

export interface DashboardFilters {
  timeRange: TimeRange;
  team: TeamName | 'All teams';
  repo: RepoName | 'All repos';
}

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  static?: boolean;
}

export type SystemTemplateId = 'cto' | 'vp' | 'tl' | 'devops' | 'ic' | 'overview';

export type DashboardSourceType =
  | 'system-template'
  | 'user-created'
  | 'forked';

export type DashboardVisibility = 'private' | 'team' | 'org';

export interface DashboardWidgetInstance {
  instanceId: string;
  widgetType: WidgetType;
  config: WidgetConfig;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  sourceType: DashboardSourceType;
  sourceTemplateId?: SystemTemplateId;
  forkedFromId?: string;
  visibility: DashboardVisibility;
  teamId?: string;
  shareToken?: string;
  defaultFilters: DashboardFilters;
  widgets: DashboardWidgetInstance[];
  layout: WidgetLayout[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface DashboardDraft {
  dashboardId: string;
  changes: Partial<
    Pick<Dashboard, 'name' | 'description' | 'widgets' | 'defaultFilters' | 'visibility'>
  >;
  localLayout?: WidgetLayout[];
  draftedAt: string;
  baseVersion: number;
}

export interface DashboardCacheEntry {
  dashboard: Dashboard;
  fetchedAt: string;
  staleSec: number;
  draft?: DashboardDraft;
}

export interface DashboardIndexEntry {
  id: string;
  name: string;
  sourceType: DashboardSourceType;
  sourceTemplateId?: SystemTemplateId;
  visibility: DashboardVisibility;
  updatedAt: string;
  hasDraft: boolean;
}

export interface SystemTemplate {
  templateId: SystemTemplateId;
  label: string;
  description: string;
  dashboard: Omit<Dashboard, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'version'>;
}

export type DashboardListResponse = DashboardIndexEntry[];
export type SystemTemplatesResponse = SystemTemplate[];
export type DashboardResponse = Dashboard;

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  sourceType: 'user-created' | 'forked';
  sourceTemplateId?: SystemTemplateId;
  forkedFromId?: string;
  visibility: DashboardVisibility;
  teamId?: string;
  defaultFilters: DashboardFilters;
  widgets: DashboardWidgetInstance[];
  layout: WidgetLayout[];
}

export interface CreateDashboardResponse {
  dashboard: Dashboard;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  visibility?: DashboardVisibility;
  teamId?: string;
  defaultFilters?: DashboardFilters;
  widgets?: DashboardWidgetInstance[];
  layout?: WidgetLayout[];
  version: number;
}

export interface UpdateDashboardResponse {
  dashboard: Dashboard;
}

export interface ForkDashboardRequest {
  name?: string;
  visibility: DashboardVisibility;
}

export interface ForkDashboardResponse {
  dashboard: Dashboard;
}

export interface UpdateLayoutRequest {
  layout: WidgetLayout[];
  version: number;
}

export interface ShareDashboardRequest {
  visibility: DashboardVisibility;
  teamId?: string;
  generateShareToken?: boolean;
}

export interface ShareDashboardResponse {
  visibility: DashboardVisibility;
  shareToken?: string;
  shareUrl?: string;
}

export interface WidgetDataRequest {
  widgetType: WidgetType;
  config: WidgetConfig;
  resolvedFilters: DashboardFilters;
}

export interface DashboardDataRequest {
  dashboardId: string;
  widgets: WidgetDataRequest[];
}

export interface WidgetDataItem {
  instanceId: string;
  data: unknown | null;
  error?: string;
}

export interface DashboardDataResponse {
  widgets: WidgetDataItem[];
  fetchedAt: string;
}
