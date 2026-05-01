import type { Dashboard, DashboardWidgetInstance, DashboardLayout } from '../dashboard';
import { createMockStatCardWidget, createMockMetricChartWidget } from '../mocks/widgets';
import type { MetricId } from '../metrics';

export const createMockCTODashboard = (): Dashboard => ({
  id: 'cto-1',
  name: 'CTO Dashboard',
  sourceType: 'system-template',
  sourceTemplateId: 'cto',
  visibility: 'org',
  defaultFilters: {
    timeRange: '30d',
    team: 'All teams',
    repo: 'All repos',
  },
  widgets: [
    createMockStatCardWidget('deploy-freq', 'widget-1'),
    createMockMetricChartWidget('deploy-freq', 'widget-2'),
    createMockMetricChartWidget('lead-time', 'widget-3'),
  ],
  layout: [
    { i: 'widget-1', x: 0, y: 0, w: 4, h: 1 },
    { i: 'widget-2', x: 0, y: 1, w: 6, h: 2 },
    { i: 'widget-3', x: 6, y: 1, w: 6, h: 2 },
  ],
  createdBy: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
});
