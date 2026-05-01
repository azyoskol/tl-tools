import type { Dashboard, DashboardFilters, WidgetLayout, DashboardWidgetInstance } from '../dashboard';
import type { WidgetConfig, WidgetType } from '../widgets';
import { createMockMetricTimeSeries } from '../mocks/metrics';
import type { MetricId } from '../metrics';

export const createMockStatCardWidget = (metricId: MetricId, instanceId: string): DashboardWidgetInstance => ({
  instanceId,
  widgetType: 'stat-card',
  config: {
    type: 'stat-card',
    metricId,
    showSparkline: true,
    colorKey: 'cyan',
  } as WidgetConfig,
});

export const createMockMetricChartWidget = (metricId: MetricId, instanceId: string): DashboardWidgetInstance => ({
  instanceId,
  widgetType: 'metric-chart',
  config: {
    type: 'metric-chart',
    metricId,
    chartVariant: 'area',
    showCompare: true,
  } as WidgetConfig,
});
