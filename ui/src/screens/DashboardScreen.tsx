import React, { useEffect, useState } from 'react';
import { getInsights } from '../api/metrics';
import { MetricCard } from '../components/ui/MetricCard';
import { AIInsightCard } from '../components/ui/AIInsightCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Widget } from '../components/ui/Widget';
import { makeTimeSeries } from '../components/charts/utils';

interface Insight { title: string; body: string; action?: string }

export const DashboardScreen: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    getInsights().then((r: any) => setInsights(r.insights)).catch(() => {});
  }, []);

  const cards = [
    { label: 'Deploy Frequency', value: '4.2/day', delta: '+0.8', trend: 'up' as const, sparkline: makeTimeSeries(1, 10, 4, 1) },
    { label: 'Lead Time', value: '2.1 hrs', delta: '-0.3', trend: 'up' as const, sparkline: makeTimeSeries(2, 10, 2.5, 0.5) },
    { label: 'MTTR', value: '12 min', delta: '-5 min', trend: 'up' as const, sparkline: makeTimeSeries(3, 10, 15, 3) },
    { label: 'Change Failure', value: '4%', delta: '-2%', trend: 'up' as const, sparkline: makeTimeSeries(4, 10, 5, 1) },
  ];

  return (
    <div className="fade-up-1" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Engineering Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {cards.map((c, i) => <MetricCard key={i} {...c} />)}
      </div>

      <SectionHeader title="AI Insights" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
        {insights.slice(0, 2).map((ins, i) => (
          <AIInsightCard key={i} title={ins.title} body={ins.body} action={ins.action} />
        ))}
      </div>

      <Widget>
        <SectionHeader title="Recent Activity" />
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>
          <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>Platform team deployed v2.4.0 to production</div>
          <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>Frontend team merged 3 PRs</div>
          <div style={{ padding: '12px 0' }}>DevOps resolved incident in #incidents channel</div>
        </div>
      </Widget>
    </div>
  );
};