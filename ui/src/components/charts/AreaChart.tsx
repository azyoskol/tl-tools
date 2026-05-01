import React from 'react';

interface DataPoint { date?: string; value: number }
type DataInput = DataPoint[] | number[];

interface AreaChartProps {
  data: DataInput;
  compare?: DataInput;
  width?: number;
  height?: number;
  color?: string;
  compareColor?: string;
  showGrid?: boolean;
}

const bezierPath = (data: number[], width: number, height: number): string => {
  if (data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / range) * height * 0.9 - height * 0.05
  }));
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const cpX = (p0.x + p1.x) / 2;
    d += ` Q ${p0.x + (cpX - p0.x) * 0.5},${p0.y} ${cpX},${(p0.y + p1.y) / 2}`;
    d += ` Q ${cpX + (p1.x - cpX) * 0.5},${(p0.y + p1.y) / 2} ${p1.x},${p1.y}`;
  }
  return d;
};

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  compare,
  width = 400,
  height = 200,
  color = '#00E5FF',
  compareColor = '#B44CFF',
  showGrid = true
}) => {
  const arr = (data as DataPoint[]).map(d => typeof d === 'number' ? d : (d as DataPoint).value);
  const compArr = compare ? (compare as DataPoint[]).map(d => typeof d === 'number' ? d : (d as DataPoint).value) : undefined;
  
  if (arr.length < 2) return null;

  const path = bezierPath(arr, width, height);
  const areaPath = path + ` L ${width},${height} L 0,${height} Z`;
  const comparePath = compArr ? bezierPath(compArr, width, height) : '';
  const compareAreaPath = comparePath ? comparePath + ` L ${width},${height} L 0,${height} Z` : '';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {showGrid && (
        <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
          {[0,0.25,0.5,0.75,1].map((p, i) => (
            <line key={i} x1="0" y1={p * height} x2={width} y2={p * height} />
          ))}
        </g>
      )}
      {compArr && <path d={compareAreaPath} fill={compareColor} fillOpacity="0.1" />}
      {compArr && <path d={comparePath} fill="none" stroke={compareColor} strokeWidth="2" strokeDasharray="4,4" />}
      <path d={areaPath} fill={color} fillOpacity="0.2" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};