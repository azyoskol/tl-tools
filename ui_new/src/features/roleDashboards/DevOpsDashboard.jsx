import React from 'react';
import { StatCard, Widget, InlineInsight, Badge, SH } from '../../components/ui';
import { AreaChart, Heatmap } from '../../components/charts';
import { DataTable } from '../../components/ui/DataTable';
import { makeTimeSeries, makeHeatData } from '../../utils/seeds';

export const DevOpsDashboard = () => {
  const deployFreq = makeTimeSeries(14, 3.8, 2, 0.1, 44);
  const mttrTrend = makeTimeSeries(12, 42, 20, -2, 55);
  const deployHeatData = makeHeatData(7, 16, 0.45, 66);
  const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
      <StatCard icon="zap" label="Deploy Freq (7d avg)" value="4.1/day" trend="+0.6" trendDir="up" color="success" spark={makeTimeSeries(12, 3.2, 1.2, 0.07, 10)} delay={0} />
      <StatCard icon="clock" label="MTTR" value="18 min" sub="p50 incidents" trend="−6 min" trendDir="up" color="cyan" spark={makeTimeSeries(12, 28, 10, -0.8, 11)} delay={1} />
      <StatCard icon="alertTri" label="Change Failure Rate" value="2.8%" trend="−0.9%" trendDir="up" color="warning" spark={makeTimeSeries(12, 4.5, 1.2, -0.12, 12)} delay={2} />
      <StatCard icon="activity" label="Service Uptime" value="99.91%" trend="+0.04%" trendDir="up" color="success" delay={3} />

      <div className="fade-up-2" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Deploy Frequency" right="Deploys/day — 14d" />
          <AreaChart data={deployFreq} color="#00C853" height={150} labels={Array.from({ length: 14 }, (_, i) => `D${i + 1}`)} />
        </Widget>
      </div>

      <div className="fade-up-3" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="MTTR Trend" right="Minutes" />
          <AreaChart data={mttrTrend} color="#FF9100" height={150} labels={Array.from({ length: 12 }, (_, i) => `W${i + 1}`)} />
        </Widget>
      </div>

      <div className="fade-up-4" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Deploy Activity" right="Last 16 days by weekday" />
          <Heatmap data={deployHeatData} rows={7} cols={16} labelRows={dayLabels} color="#00C853" cellSize={16} gap={3} />
        </Widget>
      </div>

      <div className="fade-up-5" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Recent Incidents" right="Last 7 days" />
          <DataTable
            columns={['Service', 'Severity', 'MTTR', 'Status']}
            rows={[
              ['api-gateway', 'P1', '12 min', <Badge status="Done" />],
              ['auth-service', 'P2', '31 min', <Badge status="Done" />],
              ['data-pipeline', 'P2', '—', <Badge status="Open" />],
              ['cdn-proxy', 'P3', '8 min', <Badge status="Done" />],
              ['notification-svc', 'P3', '—', <Badge status="Open" />],
            ]}
          />
        </Widget>
      </div>

      <div className="fade-up-6" style={{ gridColumn: 'span 4' }}>
        <InlineInsight
          text="Two open P2/P3 incidents have no assigned responder. data-pipeline has been degraded for 4.2 hours. Auto-escalation is not configured — recommend enabling PagerDuty escalation policy for services without active ownership."
          action="Configure escalation"
        />
      </div>
    </div>
  );
};