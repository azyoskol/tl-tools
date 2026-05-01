import React from 'react';
import { bezierPath } from './utils';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  width = 120,
  height = 24,
  color = '#00E5FF',
  fill = false
}) => {
  if (data.length < 2) return null;
  const path = bezierPath(data, width, height);
  const areaPath = path + ` L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && <path d={areaPath} fill={color} fillOpacity="0.15" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};