import React from 'react';
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}
export const Sparkline: React.FC<SparklineProps> = ({ data, color = '#00E5FF', height = 36 }) => {
  const VW = 200, VH = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v: number, i: number) => {
    const x = (i / (data.length - 1)) * VW;
    const y = VH - ((v - min) / range) * (VH - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const areaPts = `0,${VH} ${pts} ${VW},${VH}`;
  const uid = `sp-${color.replace('#', '')}-${Math.random()}`;
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: VH, display: 'block', overflow: 'visible' }}>
      <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={areaPts} fill={`url(#${uid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};