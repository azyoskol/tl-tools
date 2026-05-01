import React from 'react';
import { useDeployFrequency, useLeadTime, useChangeFailureRate, useMTTR } from '../../hooks/useMetricsData';
import { StatCard, Widget, InlineInsight, Badge, SH } from '../../components/ui';
import { AreaChart, BarChart, Heatmap } from '../../components/charts';
import { makeTimeSeries, makeHeatData } from '../../utils/seeds';
import { DataTable } from '../../components/ui/DataTable';

export const VPDashboard = () => {
  const sprintVelocity = makeTimeSeries(12, 72, 12, 0.5, 55);
  const prCycleByTeam = { labels: ['Platform', 'Mobile', 'Backend', 'Frontend', 'Data'], values: [18, 24, 14, 31, 22] };
  const heatData = makeHeatData(5, 14, 0.5, 33);
  const teamLabels = ['Platform', 'Mobile', 'Backend', 'Frontend', 'Data'];
  const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
      <StatCard icon="zap" label="Sprint Velocity" value="76 pts" trend="+4" trendDir="up" color="cyan" spark={makeTimeSeries(12, 70, 8, 0.3, 5)} delay={0} />
      <StatCard icon="clock" label="Avg PR Cycle Time" value="22h" trend="+3h" trendDir="down" color="warning" spark={makeTimeSeries(12, 18, 5, 0.2, 6)} delay={1} />
      <StatCard icon="alertTri" label="At-Risk Deliverables" value="3" sub="of 18 active" trend="same" trendDir="neutral" color="warning" delay={2} />
      <StatCard icon="gitPR" label="Open PRs" value="31" trend="+7" trendDir="down" color="purple" spark={makeTimeSeries(12, 22, 6, 0.5, 7)} delay={3} />

      <div className="fade-up-2" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Sprint Velocity Trend" right="Last 12 sprints" />
          <AreaChart data={sprintVelocity} compare={makeTimeSeries(12, 65, 10, 0.2, 200)} color="#00E5FF" height={150}
            labels={Array.from({ length: 12 }, (_, i) => `S${i + 1}`)} />
        </Widget>
      </div>

      <div className="fade-up-3" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="PR Cycle Time by Team" right="Hours" />
          <BarChart labels={prCycleByTeam.labels} values={prCycleByTeam.values} height={150} color="#B44CFF" horizontal={true} />
        </Widget>
      </div>

      <div className="fade-up-4" style={{ gridColumn: 'span 3' }}>
        <Widget>
          <SH title="Team Commit Activity" right="Last 2 weeks · by day" />
          <Heatmap data={heatData} rows={5} cols={14} labelRows={teamLabels} labelCols={weekdayLabels} color="#00E5FF" cellSize={18} gap={4} />
        </Widget>
      </div>

      <div className="fade-up-5" style={{ gridColumn: 'span 1' }}>
        <Widget style={{ height: '100%' }}>
          <SH title="Delivery Risk" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'Auth refactor', team: 'Backend', status: 'At risk' },
              { name: 'iOS release v4.2', team: 'Mobile', status: 'Blocked' },
              { name: 'Data pipeline v2', team: 'Data', status: 'At risk' },
              { name: 'API gateway', team: 'Platform', status: 'On track' },
              { name: 'Design system', team: 'Frontend', status: 'On track' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12.5, color: 'var(--text)' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.team}</div>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
          </div>
        </Widget>
      </div>

      <div className="fade-up-6" style={{ gridColumn: 'span 4' }}>
        <InlineInsight
          text="Frontend team PR cycle time is 31h — 41% above the org median. Most of the delay is in review wait time, not implementation. Consider auto-assigning reviewers and setting a 4h SLA on initial review."
          action="Configure auto-assign"
        />
      </div>
    </div>
  );
};