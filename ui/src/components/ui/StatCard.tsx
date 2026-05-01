import React from 'react';

interface StatCardProps { icon?: React.ReactNode; label: string; value: string; trend?: string; trendDir?: 'up' | 'down' }

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, trendDir }) => (
  <div style={{
    background: 'var(--glass)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px'
  }}>
    {icon && <div style={{ color: 'var(--cyan)' }}>{icon}</div>}
    <div style={{ flex: 1 }}>
      <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 600 }}>{value}</div>
    </div>
    {trend && (
      <div style={{ color: trendDir === 'up' ? '#00C853' : '#FF1744', fontSize: '12px' }}>
        {trendDir === 'up' ? '↑' : '↓'} {trend}
      </div>
    )}
  </div>
);