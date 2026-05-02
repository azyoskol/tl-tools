import React from 'react';
import type { Dashboard } from '../../types/dashboard';
import { widgetRegistry } from './widgetRegistry';
import type { WidgetConfig } from '../../types/widgets';
import type { MetricTimeSeries } from '../../types/metrics';

interface DashboardRendererProps {
  dashboard: Dashboard;
  widgetData?: Record<string, MetricTimeSeries>;
}

export const DashboardRenderer: React.FC<DashboardRendererProps> = ({ dashboard, widgetData = {} }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
      {dashboard.widgets.map((widget) => {
        const WidgetComponent = widgetRegistry[widget.widgetType];
        const layoutItem = dashboard.layout.find((l) => l.i === widget.instanceId);
        const w = layoutItem?.w || 12;
        const h = layoutItem?.h || 1;
        const x = layoutItem?.x || 1;
        return (
          <div
            key={widget.instanceId}
            style={{
              gridColumn: `${x} / span ${w}`,
              gridRow: `span ${h}`,
            }}
          >
            <WidgetComponent config={widget.config} data={widgetData[widget.instanceId]} />
          </div>
        );
      })}
    </div>
  );
};