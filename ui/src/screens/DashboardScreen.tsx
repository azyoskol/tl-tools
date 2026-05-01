import React from 'react';
import { MetricCard } from '../components/ui/MetricCard';
import { AIInsightCard } from '../components/ui/AIInsightCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Widget } from '../components/ui/Widget';

export const DashboardScreen: React.FC = () => {
  const metrics = [
    { icon: 'gitPR' as const, label: 'PRs awaiting review', value: '14', trend: '+3 today', trendDir: 'down' as const, accentColor: 'var(--cyan)', sparkData: [4,7,5,9,6,8,11,14] },
    { icon: 'xCircle' as const, label: 'Failed builds (24h)', value: '3', trend: '−5 vs avg', trendDir: 'up' as const, accentColor: 'var(--error)', sparkData: [12,9,11,7,5,8,4,3] },
    { icon: 'alertTri' as const, label: 'Blocked tasks', value: '7', trend: 'No change', trendDir: 'neutral' as const, accentColor: 'var(--warning)', sparkData: [5,6,7,7,6,8,7,7] },
    { icon: 'clock' as const, label: 'Median CI time', value: '4m 22s', trend: '−18s', trendDir: 'up' as const, accentColor: 'var(--purple)', sparkData: [8,7,9,6,7,5,5,4] },
  ];

  const insights = [
    { title: 'CI slowdown detected in monorepo', body: '3 workflows exceeded p95 latency over the last 6 hours. Root cause appears to be a Docker layer cache miss introduced in commit a3f91b.', action: 'View affected jobs' },
    { title: 'PR review load imbalanced', body: '@alex.kim has 9 open PRs awaiting review while the team average is 2.3. Consider redistributing or enabling auto-assignment.', action: 'Open PR queue' },
    { title: 'Deployment cadence slowing', body: 'Release frequency dropped 40% this week compared to the 4-week rolling average. No clear blocker found — recommend a retro.' },
  ];

  const activity = [
    { who: 'push → main', what: 'CI pipeline triggered for feat/auth-tokens', when: '2 min ago', status: 'running', color: 'var(--cyan)' },
    { who: 'alex.kim', what: 'Merged PR #812: Add rate limiting middleware', when: '14 min ago', status: 'success', color: 'var(--success)' },
    { who: 'sara.chen', what: 'PR #814 opened: Refactor API layer', when: '31 min ago', status: 'open', color: 'var(--warning)' },
    { who: 'ci-bot', what: 'Deploy to staging failed — build #4221', when: '1 hr ago', status: 'error', color: 'var(--error)' },
  ];

  return (
    <div className="fade-up-1" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Engineering Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      <SectionHeader title="AI Insights" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {insights.map((ins, i) => (
          <AIInsightCard key={i} title={ins.title} body={ins.body} action={ins.action} />
        ))}
      </div>

      <Widget>
        <SectionHeader title="Recent Activity" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {activity.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none', gap: '16px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: '14px', minWidth: '180px', color: 'var(--muted)' }}>{item.who}</span>
              <span style={{ fontSize: '14px', flex: 1, color: 'var(--text)' }}>{item.what}</span>
              <span style={{ fontSize: '14px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{item.when}</span>
            </div>
          ))}
        </div>
      </Widget>
    </div>
  );
};