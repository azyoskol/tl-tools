import React, { useEffect } from 'react';
import { getRole } from '../api/metrics';
import { StatCard } from '../components/ui/StatCard';
import { Heatmap } from '../components/charts/Heatmap';
import { AreaChart } from '../components/charts/AreaChart';
import { BarChart } from '../components/charts/BarChart';
import { Widget } from '../components/ui/Widget';
import { InlineInsight } from '../components/ui/InlineInsight';

const makeTimeSeries = (points: number, base: number, variance: number, trend: number): number[] => 
  Array.from({ length: points }, (_, i) => base + (Math.random() - 0.5) * variance + trend * i);

const SH = ({ title, right }: { title: string; right?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 4 }}>
    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{title}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    {right && <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{right}</span>}
  </div>
);

const Badge = ({ status }: { status: string }) => {
  const map: Record<string, [string, string]> = {
    'On track': ['#00C853', 'rgba(0,200,83,0.12)'],
    'At risk': ['#FF9100', 'rgba(255,145,0,0.12)'],
    'Blocked': ['#FF1744', 'rgba(255,23,68,0.12)'],
    'Done': ['#00C853', 'rgba(0,200,83,0.1)'],
    'Open': ['#00E5FF', 'rgba(0,229,255,0.1)'],
  };
  const [c, bg] = map[status] || ['var(--muted)', 'rgba(107,122,154,0.1)'];
  return (
    <span style={{ fontSize: 10.5, color: c, background: bg, border: `1px solid ${c}30`, borderRadius: 4, padding: '2px 7px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
};

export const VPDashboard: React.FC = () => {
  useEffect(() => { getRole('vp').catch(() => {}); }, []);

  const sprintVelocity = makeTimeSeries(12, 72, 12, 0.5);
  const prCycleByTeam = { labels: ['Platform', 'Mobile', 'Backend', 'Frontend', 'Data'], values: [18, 24, 14, 31, 22] };
  const heatData = Array.from({ length: 5 }, () => Array.from({ length: 14 }, () => Math.random() * 100));
  const teamLabels = ['Platform', 'Mobile', 'Backend', 'Frontend', 'Data'];
  const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="fade-up-2" style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Sprint Velocity" value="76 pts" trend="+4" trendDir="up" accentColor="var(--cyan)" />
        <StatCard label="Avg PR Cycle Time" value="22h" trend="+3h" trendDir="down" accentColor="var(--warning)" />
        <StatCard label="At-Risk Deliverables" value="3" sub="of 18 active" trend="same" trendDir="neutral" accentColor="var(--warning)" />
        <StatCard label="Open PRs" value="31" trend="+7" trendDir="down" accentColor="var(--purple)" />
      </div>

      {/* Sprint velocity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Widget>
          <SH title="Sprint Velocity Trend" right="Last 12 sprints" />
          <AreaChart data={sprintVelocity.map((v, i) => ({ date: `S${i+1}`, value: v }))} width={350} height={150} />
        </Widget>

        {/* PR Cycle time by team */}
        <Widget>
          <SH title="PR Cycle Time by Team" right="Hours" />
          <BarChart data={prCycleByTeam.values.map((v, i) => ({ label: prCycleByTeam.labels[i], value: v }))} width={350} height={150} horizontal />
        </Widget>
      </div>

      {/* Team activity heatmap */}
      <Widget style={{ marginBottom: 14 }}>
        <SH title="Team Commit Activity" right="Last 2 weeks · by day" />
        <Heatmap data={heatData} rows={5} cols={14} labelRows={teamLabels} labelCols={weekdayLabels} />
      </Widget>

      {/* Delivery risk table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 14, marginBottom: 14 }}>
        <Widget>
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
        <div style={{ gridColumn: 'span 1' }}></div>
      </div>

      <InlineInsight text="Frontend team PR cycle time is 31h — 41% above the org median. Most of the delay is in review wait time, not implementation. Consider auto-assigning reviewers and setting a 4h SLA on initial review." action="Configure auto-assign" />
    </div>
  );
};