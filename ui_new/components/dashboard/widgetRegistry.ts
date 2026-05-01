import type { WidgetType, WidgetConfig } from '../../types/widgets';
import type { MetricTimeSeries } from '../../types/metrics';
import React from 'react';

const MetricChartWidget = ({ config }: { config: WidgetConfig }) => <div>Metric Chart</div>;
const StatCardWidget = ({ config }: { config: WidgetConfig }) => <div>Stat Card</div>;
const GaugeWidget = ({ config }: { config: WidgetConfig }) => <div>Gauge</div>;
const DORAOverviewWidget = ({ config }: { config: WidgetConfig }) => <div>DORA Overview</div>;
const HeatmapWidget = ({ config }: { config: WidgetConfig }) => <div>Heatmap</div>;
const DataTableWidget = ({ config }: { config: WidgetConfig }) => <div>Data Table</div>;
const LeaderboardWidget = ({ config }: { config: WidgetConfig }) => <div>Leaderboard</div>;
const SprintBurndownWidget = ({ config }: { config: WidgetConfig }) => <div>Sprint Burndown</div>;
const AIInsightWidget = ({ config }: { config: WidgetConfig }) => <div>AI Insight</div>;
const AnomalyDetectorWidget = ({ config }: { config: WidgetConfig }) => <div>Anomaly Detector</div>;
const CompareBarChartWidget = ({ config }: { config: WidgetConfig }) => <div>Compare Bar Chart</div>;

export const widgetRegistry: Record<WidgetType, React.FC<{ config: WidgetConfig; data?: MetricTimeSeries }>> = {
  'metric-chart': MetricChartWidget,
  'stat-card': StatCardWidget,
  'health-gauge': GaugeWidget,
  'dora-overview': DORAOverviewWidget,
  'heatmap': HeatmapWidget,
  'data-table': DataTableWidget,
  'leaderboard': LeaderboardWidget,
  'sprint-burndown': SprintBurndownWidget,
  'ai-insight': AIInsightWidget,
  'anomaly-detector': AnomalyDetectorWidget,
  'compare-bar-chart': CompareBarChartWidget,
};