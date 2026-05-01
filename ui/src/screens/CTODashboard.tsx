import React, { useEffect, useState } from 'react';
import { getRole } from '../api/metrics';
import { StatCard } from '../components/ui/StatCard';
import { Gauge } from '../components/charts/Gauge';
import { AreaChart } from '../components/charts/AreaChart';
import { Widget } from '../components/ui/Widget';

export const CTODashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { getRole('cto').then(setData).catch(() => {}); }, []);
  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  const healthScore = data?.payload?.healthScore || 0;
  const deployTrend = data?.payload?.deployTrend || [];

  return (
    <div className="fade-up-2" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>CTO Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {(data.stats || []).map((s: any, i: number) => <StatCard key={i} label={s.label} value={s.value} trend={s.trend} trendDir={s.trendDir as any} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {healthScore > 0 && <Widget><h3 style={{ marginBottom: 16 }}>Engineering Health</h3><Gauge value={healthScore} label="Score" /></Widget>}
        {deployTrend.length > 0 && <Widget><h3 style={{ marginBottom: 16 }}>Deploy Trend</h3><AreaChart data={deployTrend} width={350} height={150} /></Widget>}
      </div>
    </div>
  );
};