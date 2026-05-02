import type { Dashboard } from '../dashboard';
import { createMockStatCardWidget, createMockMetricChartWidget } from './widgets';

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

export const createMockVPDashboard = (): Dashboard => ({
  id: 'vp-1',
  name: 'VP Engineering Dashboard',
  sourceType: 'system-template',
  sourceTemplateId: 'vp',
  visibility: 'org',
  defaultFilters: {
    timeRange: '30d',
    team: 'All teams',
    repo: 'All repos',
  },
  widgets: [
    createMockStatCardWidget('velocity', 'widget-1'),
    createMockMetricChartWidget('pr-cycle', 'widget-2'),
    createMockMetricChartWidget('throughput', 'widget-3'),
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

export const createMockTLDashboard = (): Dashboard => ({
  id: 'tl-1',
  name: 'Tech Lead Dashboard',
  sourceType: 'system-template',
  sourceTemplateId: 'tl',
  visibility: 'team',
  defaultFilters: {
    timeRange: '14d',
    team: 'All teams',
    repo: 'All repos',
  },
  widgets: [
    createMockStatCardWidget('ci-pass', 'widget-1'),
    createMockMetricChartWidget('pr-review', 'widget-2'),
    createMockMetricChartWidget('sprint-burndown', 'widget-3'),
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

export const createMockDevOpsDashboard = (): Dashboard => ({
  id: 'devops-1',
  name: 'DevOps Dashboard',
  sourceType: 'system-template',
  sourceTemplateId: 'devops',
  visibility: 'org',
  defaultFilters: {
    timeRange: '30d',
    team: 'All teams',
    repo: 'All repos',
  },
  widgets: [
    createMockStatCardWidget('deploy-freq', 'widget-1'),
    createMockMetricChartWidget('mttr', 'widget-2'),
    createMockMetricChartWidget('ci-duration', 'widget-3'),
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

export const createMockICDashboard = (): Dashboard => ({
  id: 'ic-1',
  name: 'My Dashboard',
  sourceType: 'system-template',
  sourceTemplateId: 'ic',
  visibility: 'private',
  defaultFilters: {
    timeRange: '7d',
    team: 'All teams',
    repo: 'All repos',
  },
  widgets: [
    createMockStatCardWidget('ci-pass', 'widget-1'),
    createMockMetricChartWidget('pr-merge', 'widget-2'),
    createMockStatCardWidget('velocity', 'widget-3'),
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
