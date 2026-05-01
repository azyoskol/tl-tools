import React from 'react';
export const Gauge = ({ value = 0.72, label = 'Score', size = 140 }) => {
  const R = 52, cx = 70, cy = 64;
  const angle = Math.PI + value * Math.PI;
  const x2 = cx + R * Math.cos(angle);
  const y2 = cy + R * Math.sin(angle);
  const trackPath = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  const fillPath = `M ${(cx - R).toFixed(1)} ${cy} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  return (
    <svg viewBox="0 0 140 88" style={{ width: size, height: Math.round(size * 0.63), display: 'block', overflow: 'visible' }}>
      <defs><linearGradient id="gauge-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="var(--cyan)" /><stop offset="100%" stopColor="var(--purple)" /></linearGradient></defs>
      <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeLinecap="round" />
      <path d={fillPath} fill="none" stroke="url(#gauge-g)" strokeWidth="10" strokeLinecap="round" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--text)" fontFamily="var(--font-head)">{Math.round(value * 100)}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="var(--font-body)">{label}</text>
    </svg>
  );
};