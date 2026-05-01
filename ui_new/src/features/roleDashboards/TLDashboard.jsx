import React from 'react';
import { StatCard, Widget, InlineInsight, Badge, SH } from '../../components/ui';
import { AreaChart, BarChart, Heatmap } from '../../components/charts';
import { DataTable } from '../../components/ui/DataTable';
import { makeTimeSeries } from '../../utils/seeds';
import { useTweaks } from '../../context/TweaksContext';

export const TLDashboard = () => {
  const ciPassRate = makeTimeSeries(21, 88, 8, 0.3, 13);
  const burndown = makeTimeSeries(14, 58, 6, -3.8, 14);
  const dayLabels = Array.from({ length: 14 }, (_, i) => `D${i + 1}`);
  const { tweaks } = useTweaks();
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
      <StatCard icon="activity" label="CI Pass Rate (7d)" value="92.4%" trend="+2.1%" trendDir="up" color="success" spark={makeTimeSeries(12, 88, 5, 0.2, 8)} delay={0} />
      <StatCard icon="gitPR" label="PRs Awaiting Review" value="8" sub="3 older than 24h" trend="+2" trendDir="down" color="warning" delay={1} />
      <StatCard icon="clock" label="Avg Build Time" value="4m 18s" trend="−22s" trendDir="up" color="cyan" spark={makeTimeSeries(12, 5.2, 0.8, -0.08, 9)} delay={2} />
      <StatCard icon="alertTri" label="Flaky Tests" value="7" sub="in api-gateway" trend="+2" trendDir="down" color="error" delay={3} />

      <div className="fade-up-2" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="CI Pass Rate" right="Last 3 weeks" />
          <AreaChart data={ciPassRate} color="#00C853" height={150}
            labels={Array.from({ length: 21 }, (_, i) => i % 7 === 0 ? `W${Math.floor(i / 7) + 1}` : '')} />
        </Widget>
      </div>

      <div className="fade-up-3" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Sprint Burndown" right="14 days remaining" />
          <AreaChart data={burndown} compare={makeTimeSeries(14, 58, 0, -58 / 14, 999)} color={tweaks.accentColor} compareColor="#6B7A9A" height={150} labels={dayLabels} />
        </Widget>
      </div>

      <div className="fade-up-4" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="PR Review Queue" />
          <DataTable
            columns={['Pull Request', 'Author', 'Age', 'Status']}
            rows={[
              ['feat/auth-tokens', '@j.kim', '3h', <Badge status="Open" />],
              ['fix/rate-limit', '@s.chen', '8h', <Badge status="Open" />],
              ['refactor/api-layer', '@m.patel', '19h', <Badge status="Open" />],
              ['chore/deps-update', '@j.kim', '26h', <Badge status="Open" />],
              ['feat/webhooks-v2', '@a.garcia', '31h', <Badge status="Blocked" />],
            ]}
          />
        </Widget>
      </div>

      <div className="fade-up-5" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Recent Failures" right="Last 24h" />
          <DataTable
            columns={['Workflow', 'Repo', 'Failed at']}
            rows={[
              ['integration-tests', 'api-gateway', '2h ago'],
              ['docker-build', 'monorepo', '5h ago'],
              ['e2e-suite', 'frontend', '9h ago'],
              ['security-scan', 'auth-service', '14h ago'],
            ]}
          />
        </Widget>
      </div>

      <div className="fade-up-6" style={{ gridColumn: 'span 4' }}>
        <InlineInsight
          text="7 flaky tests in api-gateway have caused 12 false CI failures this week. The tests relate to async timeout handling introduced in feat/webhooks-v2. Fixing or quarantining them would recover ~18 wasted engineer-hours per week."
          action="View flaky tests"
        />
      </div>
    </div>
  );
};