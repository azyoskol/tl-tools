import React from 'react';
import { MiniSparkline } from '../charts/MiniSparkline';

interface MetricCardProps {
  label: string;
  value: string;
  trend: string;
  trendDir?: 'up' | 'down' | 'neutral';
  accentColor?: string;
  sparkData?: number[];
  icon?: 'gitPR' | 'xCircle' | 'alertTri' | 'clock';
}

const iconMap: Record<string, React.ReactNode> = {
  gitPR: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>
    </svg>
  ),
  xCircle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
    </svg>
  ),
  alertTri: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend, trendDir = 'neutral', accentColor = 'var(--cyan)', sparkData, icon }) => {
  const trendColor = trendDir === 'up' ? '#00C853' : trendDir === 'down' ? '#FF1744' : 'var(--muted)';
  const trendIcon = trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '→';
  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <div style={{
      background: 'var(--glass)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: accentColor }}>
        {IconComponent && <span>{IconComponent}</span>}
        <span style={{ color: 'var(--muted)', fontSize: '14px' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-head)' }}>{value}</span>
        {sparkData && <MiniSparkline data={sparkData} width={80} height={32} color={accentColor} />}
      </div>
      <span style={{ color: trendColor, fontSize: '13px', fontWeight: 500 }}>
        {trendIcon} {trend}
      </span>
    </div>
  );
};