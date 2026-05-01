import React from 'react';

interface MiniSparklineProps {
  data?: number[];
  color?: string;
  height?: number;
  width?: number;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data = [],
  color = '#00E5FF',
  height = 36,
}) => {
  const arr = data.map(d => (typeof d === 'object' ? (d as any).value : d));
  const w = 80, h = height;

  if (arr.length < 2) {
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }

  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;

  const pts = arr.map((v, i) => {
    const x = (i / (arr.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });

  const linePts = pts.join(' ');
  const area = `M0,${h} L${pts.join(' L')} L${w},${h} Z`;
  const uid = `sg-${color.replace('#', '')}`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${uid})`} />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
