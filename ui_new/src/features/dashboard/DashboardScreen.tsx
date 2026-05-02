// src/features/dashboard/DashboardScreen.tsx
import React from 'react';
import { StatCard, AIInsightCard } from '../../components/ui';
import { Icon } from '../../components/shared/Icon';
import { useTweaks } from '../../context/TweaksContext';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';

export const DashboardScreen = () => {
  const { tweaks } = useTweaks();
  const { metrics, insights, recentActivity, isLoading } = useDashboardOverview();
  const density = tweaks.density as 'compact' | 'comfortable' | 'spacious';
  const gap = { compact: 12, comfortable: 16, spacious: 24 }[density] ?? 16;
  const padding = { compact: '16px 20px', comfortable: '24px 28px', spacious: '32px 36px' }[density] ?? '24px 28px';

  if (isLoading) {
    return (
      <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--muted)' }}>Loading...</span>
      </div>
    );
  }

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
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted2)', marginRight: 6 }}>{ev.actor}</span>
                {ev.description}
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{ev.relativeTime}</span>
          </div>
        ))}
      </div>
    </div>
  );
};