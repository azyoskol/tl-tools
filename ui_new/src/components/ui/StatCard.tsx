// src/components/ui/StatCard.tsx
import React, { useState } from 'react';
import { Icon } from '../shared/Icon';
import { Sparkline } from '../charts/Sparkline';
import { useTweaks } from '../../context/TweaksContext';

type TrendDir = 'up' | 'down' | 'neutral';
type ColorKey = 'cyan' | 'purple' | 'success' | 'warning' | 'error';

interface StatCardProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  sub?: string;
  trend?: string;
  trendDir?: TrendDir;
  color?: ColorKey | string;
  spark?: number[];
  delay?: number;
}

export const StatCard = ({ icon, label, value, sub, trend, trendDir, color, spark, delay = 0 }: StatCardProps) => {
  const [hov, setHov] = useState(false);
  const { tweaks } = useTweaks() as { tweaks: { showSparklines: boolean; density: string } };
  const colors: Record<ColorKey, string> = { cyan: '#00E5FF', purple: '#B44CFF', success: '#00C853', warning: '#FF9100', error: '#FF1744' };
  const c = (color && colors[color as ColorKey]) || color || '#00E5FF';
  const showSpark = tweaks.showSparklines && spark;

  return (
    <div className={`fade-up-${delay + 1}`} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: hov ? 'var(--glass2)' : 'var(--glass)',
      border: `1px solid ${hov ? 'rgba(255,255,255,0.12)' : 'var(--border)'}`,
      borderRadius: 12, padding: '16px 16px 13px', display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'all 0.2s ease', transform: hov ? 'translateY(-2px)' : 'none',
      boxShadow: hov ? `0 6px 24px rgba(0,0,0,0.35)'` : 'none',
      minHeight: showSpark ? '100%' : 'auto',
      height: showSpark ? '100%' : 'auto',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c}18`, border: `1px solid ${c}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={15} color={c} />
        </div>
        {trend && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: trendDir === 'up' ? '#00C853' : trendDir === 'down' ? '#FF1744' : 'var(--muted)', background: trendDir === 'up' ? 'rgba(0,200,83,0.1)' : trendDir === 'down' ? 'rgba(255,23,68,0.1)' : 'rgba(107,122,154,0.12)', border: `1px solid ${trendDir === 'up' ? 'rgba(0,200,83,0.2)' : trendDir === 'down' ? 'rgba(255,23,68,0.2)' : 'rgba(107,122,154,0.15)'}`, borderRadius: 5, padding: '2px 6px' }}>{trend}</span>}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.7, marginTop: 2 }}>{sub}</div>}
      </div>
      {showSpark && <Sparkline data={spark} color={c} height={28} />}
    </div>
  );
};
