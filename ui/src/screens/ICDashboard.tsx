import React, { useEffect, useState } from 'react';
import { getRole } from '../api/metrics';
import { StatCard } from '../components/ui/StatCard';
import { Widget } from '../components/ui/Widget';

export const ICDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { getRole('ic').then(setData).catch(() => {}); }, []);
  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="fade-up-2" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Individual Contributor Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {data.stats.map((s: any, i: number) => <StatCard key={i} label={s.label} value={s.value} trend={s.trend} trendDir={s.trendDir as any} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Widget><h3 style={{ marginBottom: 16 }}>My PRs</h3><div style={{ color: 'var(--muted)' }}>{data.payload.myPRs} open PRs</div></Widget>
        <Widget><h3 style={{ marginBottom: 16 }}>Review Queue</h3><div style={{ color: 'var(--muted)' }}>{data.payload.reviewQueue} PRs waiting for review</div></Widget>
      </div>
    </div>
  );
};