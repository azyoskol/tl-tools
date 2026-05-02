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
  const rowHeight = 60;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridAutoRows: `${rowHeight}px`, gridAutoFlow: 'dense', gap: '16px' }}>
      {dashboard.widgets.map((widget) => {
        const WidgetComponent = widgetRegistry[widget.widgetType];
        const layoutItem = dashboard.layout.find((l) => l.i === widget.instanceId);
        const w = layoutItem?.w || 6;
        const h = Math.max(layoutItem?.h || 2, 2);
        return (
          <div
            key={widget.instanceId}
            style={{
              gridColumn: `span ${w}`,
              gridRow: `span ${h}`,
              minHeight: `${h * rowHeight}px`,
            }}
          >
            <WidgetComponent config={widget.config} data={widgetData[widget.instanceId]} />
          </div>
        );
      })}
    </div>
  );
};