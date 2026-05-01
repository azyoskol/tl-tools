import type { WidgetConfig, WidgetType } from '../widgets';
import type { DashboardWidgetInstance } from '../dashboard';

export const createMockStatCardWidget = (metricId: string, instanceId: string): DashboardWidgetInstance => ({
  instanceId,
  widgetType: 'stat-card',
  config: {
    type: 'stat-card',
    metricId,
    showSparkline: true,
    colorKey: 'cyan',
  } as WidgetConfig,
});

export const createMockMetricChartWidget = (metricId: string, instanceId: string): DashboardWidgetInstance => ({
  instanceId,
  widgetType: 'metric-chart',
  config: {
    type: 'metric-chart',
    metricId,
    chartVariant: 'area',
    showCompare: true,
  } as WidgetConfig,
});
