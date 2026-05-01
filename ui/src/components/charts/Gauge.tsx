import React from 'react';

interface GaugeProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  max = 100,
  color = '#00E5FF',
  label,
}) => {
  const cx = 70, cy = 88, r = 60;
  const fraction = Math.min(value / max, 0.9999);
  const angle = Math.PI * fraction;

  // Start = left, end = right, sweep clockwise (goes up in screen coords)
  const sx = cx - r, sy = cy;
  const ex = cx + r, ey = cy;
  const vx = cx - r * Math.cos(angle);
  const vy = cy - r * Math.sin(angle);

  return (
    <svg viewBox="0 0 140 88" style={{ width: '100%', maxWidth: 200, overflow: 'visible', display: 'block' }}>
      <path d={`M ${sx},${sy} A ${r} ${r} 0 0 1 ${ex},${ey}`}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
      <path d={`M ${sx},${sy} A ${r} ${r} 0 0 1 ${vx},${vy}`}
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
      {label && <text x={cx} y={cy - r / 2 - 4} textAnchor="middle" fill="var(--muted)" fontSize="11">{label}</text>}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text)" fontSize="22" fontWeight="600">{Math.round(value)}%</text>
    </svg>
  );
};
