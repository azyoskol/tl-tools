import React from 'react';
import { Icon } from './Icon';
import { MiniSparkline } from '../charts/MiniSparkline';

interface MetricCardProps {
  label: string;
  value: string;
  trend: string;
  trendDir?: 'up' | 'down' | 'neutral';
  accentColor?: string;
  sparkData?: number[];
  icon?: string;
  delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label, value, trend, trendDir = 'neutral',
  accentColor = 'var(--cyan)', sparkData, icon, delay = 0,
}) => {
  const [hovered, setHovered] = React.useState(false);
  const cls = ['fade-up-1', 'fade-up-2', 'fade-up-3', 'fade-up-4'][delay] || 'fade-up';

  const trendColor = trendDir === 'up' ? 'var(--success)' : trendDir === 'down' ? 'var(--error)' : 'var(--muted)';
  const trendBg = trendDir === 'up' ? 'rgba(0,200,83,0.1)' : trendDir === 'down' ? 'rgba(255,23,68,0.1)' : 'rgba(107,122,154,0.15)';
  const trendBorder = trendDir === 'up' ? 'rgba(0,200,83,0.2)' : trendDir === 'down' ? 'rgba(255,23,68,0.2)' : 'rgba(107,122,154,0.2)';

  return (
    <div
      className={cls}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--glass2)' : 'var(--glass)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '20px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: 'default',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon && <Icon name={icon as any} size={16} color={accentColor} />}
        </div>
        <div style={{
          fontSize: 11, fontFamily: 'var(--font-mono)',
          color: trendColor,
          background: trendBg,
          border: `1px solid ${trendBorder}`,
          borderRadius: 6,
          padding: '2px 7px',
        }}>{trend}</div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>{label}</div>
      </div>
      {sparkData && (
        <div style={{ marginTop: 'auto' }}>
          <MiniSparkline data={sparkData} color={accentColor} height={36} />
        </div>
      )}
    </div>
  );
};
