import React from 'react';
import { bezierPath } from './utils';

interface AreaChartProps {
  data: number[];
  compare?: number[];
  width?: number;
  height?: number;
  color?: string;
  compareColor?: string;
  showGrid?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  compare,
  width = 400,
  height = 200,
  color = '#00E5FF',
  compareColor = '#B44CFF',
  showGrid = true
}) => {
  if (data.length < 2) return null;

  const path = bezierPath(data, width, height);
  const areaPath = path + ` L ${width},${height} L 0,${height} Z`;
  const comparePath = compare ? bezierPath(compare, width, height) : '';
  const compareAreaPath = compare ? comparePath + ` L ${width},${height} L 0,${height} Z` : '';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {showGrid && (
        <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
          {[0,0.25,0.5,0.75,1].map((p, i) => (
            <line key={i} x1="0" y1={p * height} x2={width} y2={p * height} />
          ))}
        </g>
      )}
      {compare && <path d={compareAreaPath} fill={compareColor} fillOpacity="0.1" />}
      {compare && <path d={comparePath} fill="none" stroke={compareColor} strokeWidth="2" strokeDasharray="4,4" />}
      <path d={areaPath} fill={color} fillOpacity="0.2" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};