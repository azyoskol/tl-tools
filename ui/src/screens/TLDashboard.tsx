import React, { useEffect, useState } from 'react';
import { getRole } from '../api/metrics';
import { StatCard } from '../components/ui/StatCard';
import { BarChart } from '../components/charts/BarChart';
import { Widget } from '../components/ui/Widget';

export const TLDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { getRole('tl').then(setData).catch(() => {}); }, []);
  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="fade-up-2" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Team Lead Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {data.stats.map((s: any, i: number) => <StatCard key={i} label={s.label} value={s.value} trend={s.trend} trendDir={s.trendDir as any} />)}
      </div>
      <Widget><h3 style={{ marginBottom: 16 }}>Sprint Burndown</h3><BarChart data={data.payload.burndown.map((v: number, i: number) => ({ label: `Day ${i+1}`, value: v }))} width={600} height={200} /></Widget>
    </div>
  );
};