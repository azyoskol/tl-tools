import React, { useState } from 'react';

interface StatCardProps { 
  label: string; 
  value: string; 
  trend?: string; 
  trendDir?: 'up' | 'down' | 'neutral';
  sub?: string;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  trend, 
  trendDir = 'neutral',
  sub,
  accentColor = 'var(--cyan)'
}) => {
  const [hov, setHov] = useState(false);
  
  const trendColor = trendDir === 'up' ? '#00C853' : trendDir === 'down' ? '#FF1744' : 'var(--muted)';
  const trendBg = trendDir === 'up' ? 'rgba(0,200,83,0.1)' : trendDir === 'down' ? 'rgba(255,23,68,0.1)' : 'rgba(107,122,154,0.12)';
  const trendBorder = trendDir === 'up' ? 'rgba(0,200,83,0.2)' : trendDir === 'down' ? 'rgba(255,23,68,0.2)' : 'rgba(107,122,154,0.15)';

  return (
    <div 
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--glass2)' : 'var(--glass)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.12)' : 'var(--border)'}`,
        borderRadius: 12, 
        padding: '16px 16px 13px',
        display: 'flex', 
        flexDirection: 'column', 
        gap: 10,
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 6px 24px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accentColor}18`, border: `1px solid ${accentColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        {trend && (
          <span style={{
            fontSize: 11, 
            fontFamily: 'var(--font-mono)',
            color: trendColor,
            background: trendBg,
            border: `1px solid ${trendBorder}`,
            borderRadius: 5, 
            padding: '2px 6px',
          }}>{trend}</span>
        )}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.7, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
};