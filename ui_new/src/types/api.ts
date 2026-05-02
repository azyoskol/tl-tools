import type { WidgetType, WidgetConfig } from './widgets';
import type {
  DashboardFilters,
  DashboardVisibility,
  DashboardWidgetInstance,
  DashboardIndexEntry,
  Dashboard,
  SystemTemplate,
  SystemTemplateId,
  WidgetLayout,
} from './dashboard';

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
