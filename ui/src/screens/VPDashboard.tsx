import React, { useEffect, useState } from 'react';
import { getRole } from '../api/metrics';
import { StatCard } from '../components/ui/StatCard';
import { Heatmap } from '../components/charts/Heatmap';
import { AreaChart } from '../components/charts/AreaChart';
import { Widget } from '../components/ui/Widget';

export const VPDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { getRole('vp').then(setData).catch(() => {}); }, []);
  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="fade-up-2" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>VP Engineering Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {data.stats.map((s: any, i: number) => <StatCard key={i} label={s.label} value={s.value} trend={s.trend} trendDir={s.trendDir as any} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Widget><h3 style={{ marginBottom: 16 }}>PR Cycle Time</h3><AreaChart data={data.payload.prCycleTime} width={350} height={150} /></Widget>
        <Widget><h3 style={{ marginBottom: 16 }}>Activity Heatmap</h3><Heatmap data={data.payload.heatmap} width={350} height={120} /></Widget>
      </div>
    </div>
  );
};