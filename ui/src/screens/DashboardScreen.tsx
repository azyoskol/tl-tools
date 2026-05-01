import React from 'react';
import { MetricCard } from '../components/ui/MetricCard';
import { AIInsightCard } from '../components/ui/AIInsightCard';

export const DashboardScreen: React.FC = () => {
  const metrics = [
    { icon: 'gitPR',    label: 'PRs awaiting review', value: '14',     trend: '+3 today',  trendDir: 'down' as const,    accentColor: 'var(--cyan)',    sparkData: [4,7,5,9,6,8,11,14], delay: 0 },
    { icon: 'xCircle',  label: 'Failed builds (24h)',  value: '3',      trend: '−5 vs avg', trendDir: 'up' as const,      accentColor: 'var(--error)',   sparkData: [12,9,11,7,5,8,4,3],  delay: 1 },
    { icon: 'alertTri', label: 'Blocked tasks',         value: '7',      trend: 'No change', trendDir: 'neutral' as const, accentColor: 'var(--warning)', sparkData: [5,6,7,7,6,8,7,7],    delay: 2 },
    { icon: 'clock',    label: 'Median CI time',        value: '4m 22s', trend: '−18s',      trendDir: 'up' as const,      accentColor: 'var(--purple)',  sparkData: [8,7,9,6,7,5,5,4],    delay: 3 },
  ];

  const insights = [
    { title: 'CI slowdown detected in monorepo', body: '3 workflows exceeded p95 latency over the last 6 hours. Root cause appears to be a Docker layer cache miss introduced in commit a3f91b.', action: 'View affected jobs', delay: 0 },
    { title: 'PR review load imbalanced', body: '@alex.kim has 9 open PRs awaiting review while the team average is 2.3. Consider redistributing or enabling auto-assignment.', action: 'Open PR queue', delay: 1 },
    { title: 'Deployment cadence slowing', body: 'Release frequency dropped 40% this week compared to the 4-week rolling average. No clear blocker found — recommend a retro.', delay: 2 },
  ];

  const activity = [
    { who: 'push → main', what: 'CI pipeline triggered for feat/auth-tokens', when: '2 min ago', color: 'var(--cyan)' },
    { who: 'alex.kim',    what: 'Merged PR #812: Add rate limiting middleware', when: '14 min ago', color: 'var(--success)' },
    { who: 'sara.chen',  what: 'PR #814 opened: Refactor API layer',           when: '31 min ago', color: 'var(--warning)' },
    { who: 'ci-bot',     what: 'Deploy to staging failed — build #4221',       when: '1 hr ago',   color: 'var(--error)' },
  ];

  return (
    <div style={{ padding: '24px 28px', overflow: 'auto', flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>AI Insights</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Updated 2 min ago</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {insights.map((ins, i) => <AIInsightCard key={i} {...ins} />)}
      </div>

      <div className="fade-up-4" style={{
        background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>Recent Activity</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>View all →</button>
        </div>
        {activity.map((ev, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted2)', marginRight: 6 }}>{ev.who}</span>
                {ev.what}
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{ev.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
