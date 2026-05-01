import React from 'react';
import { MiniSparkline } from '../charts/MiniSparkline';

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down';
  sparkline?: number[];
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, delta, trend, sparkline }) => (
  <div style={{
    background: 'var(--glass)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px'
  }}>
    <span style={{ color: 'var(--muted)', fontSize: '14px' }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-head)' }}>{value}</span>
      {sparkline && <MiniSparkline data={sparkline} width={80} height={32} color={trend === 'up' ? '#00C853' : '#FF1744'} />}
    </div>
    {delta && (
      <span style={{ color: trend === 'up' ? '#00C853' : '#FF1744', fontSize: '13px', fontWeight: 500 }}>
        {trend === 'up' ? '↑' : '↓'} {delta}
      </span>
    )}
  </div>
);