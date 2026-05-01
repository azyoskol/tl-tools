import React from 'react';

interface GaugeProps {
  value: number;
  max?: number;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  max = 100,
  width = 120,
  height = 70,
  color = '#00E5FF',
  label
}) => {
  const radius = width / 2 - 10;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const valueAngle = startAngle + (value / max) * (endAngle - startAngle);
  const arc = (a: number) => `${width/2 + radius * Math.cos(a)},${height + radius * Math.sin(a) - height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={`M ${arc(startAngle)} A ${radius} ${radius} 0 0 1 ${arc(endAngle)}`}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
      <path d={`M ${arc(startAngle)} A ${radius} ${radius} 0 0 1 ${arc(valueAngle)}`}
        fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <text x={width/2} y={height - 10} textAnchor="middle" fill="#E8EDF5" fontSize="18" fontWeight="600">
        {Math.round(value)}%
      </text>
      {label && <text x={width/2} y={height - 28} textAnchor="middle" fill="#6B7A9A" fontSize="10">{label}</text>}
    </svg>
  );
};
