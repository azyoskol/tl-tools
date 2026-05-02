// src/features/dashboard/DashboardScreen.tsx
import React from 'react';
import { StatCard, AIInsightCard } from '../../components/ui';
import { Icon } from '../../components/shared/Icon';
import { useTweaks } from '../../context/TweaksContext';
import type { TrendDir } from '../../types/common';

interface Metric {
  icon: string;
  label: string;
  value: string;
  trend: string;
  trendDir: TrendDir;
  color: string;
  sparkData: number[];
}

interface Insight {
  title: string;
  body: string;
  action?: string;
}

const metrics: Metric[] = [
  { icon: 'gitPR', label: 'PRs awaiting review', value: '14', trend: '+3 today', trendDir: 'down', color: 'cyan', sparkData: [4,7,5,9,6,8,11,14] },
  { icon: 'xCircle', label: 'Failed builds (24h)', value: '3', trend: '−5 vs avg', trendDir: 'up', color: 'error', sparkData: [12,9,11,7,5,8,4,3] },
  { icon: 'alertTri', label: 'Blocked tasks', value: '7', trend: 'No change', trendDir: 'neutral', color: 'warning', sparkData: [5,6,7,7,6,8,7,7] },
  { icon: 'clock', label: 'Median CI time', value: '4m 22s', trend: '−18s', trendDir: 'up', color: 'purple', sparkData: [8,7,9,6,7,5,5,4] },
];

const insights: Insight[] = [
  { title: 'CI slowdown detected in monorepo', body: '3 workflows exceeded p95 latency over the last 6 hours. Root cause appears to be a Docker layer cache miss introduced in commit a3f91b.', action: 'View affected jobs' },
  { title: 'PR review load imbalanced', body: '@alex.kim has 9 open PRs awaiting review while the team average is 2.3. Consider redistributing or enabling auto-assignment.', action: 'Open PR queue' },
  { title: 'Deployment cadence slowing', body: 'Release frequency dropped 40% this week compared to the 4-week rolling average. No clear blocker found — recommend a retro.' },
];

const recentActivity = [
  { who: 'push → main', what: 'CI pipeline triggered for feat/auth-tokens', when: '2 min ago', color: 'var(--cyan)' },
  { who: 'alex.kim', what: 'Merged PR #812: Add rate limiting middleware', when: '14 min ago', color: 'var(--success)' },
  { who: 'sara.chen', what: 'PR #814 opened: Refactor API layer', when: '31 min ago', color: 'var(--warning)' },
  { who: 'ci-bot', what: 'Deploy to staging failed — build #4221', when: '1 hr ago', color: 'var(--error)' },
];

export const DashboardScreen = () => {
  const { tweaks } = useTweaks();
  const density = tweaks.density as 'compact' | 'comfortable' | 'spacious';
  const gap = { compact: 12, comfortable: 16, spacious: 24 }[density] ?? 16;
  const padding = { compact: '16px 20px', comfortable: '24px 28px', spacious: '32px 36px' }[density] ?? '24px 28px';

  return (
    <div style={{ padding, overflow: 'auto', flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap, marginBottom: gap * 2 }}>
        {metrics.map((m, i) => (
          <StatCard key={i} icon={m.icon} label={m.label} value={m.value} trend={m.trend} trendDir={m.trendDir} color={m.color} spark={m.sparkData} delay={i} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>AI Insights</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Updated 2 min ago</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {insights.map((ins, i) => <AIInsightCard key={i} title={ins.title} body={ins.body} action={ins.action} delay={i} />)}
      </div>

      <div className="fade-up-4" style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>Recent Activity</span>
          <button style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontSize: 12, cursor: 'pointer' }}>View all →</button>
        </div>
        {recentActivity.map((ev, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
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