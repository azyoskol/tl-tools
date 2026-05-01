import React from 'react';

interface DataPoint { date?: string; value: number }
type SparkData = DataPoint[] | number[];

interface MiniSparklineProps {
  data?: SparkData;
  width?: number;
  height?: number;
  color?: string;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({ 
  data = [], 
  width = 100, 
  height = 30, 
  color = '#00E5FF' 
}) => {
  const arr = (data as DataPoint[]).map(d => typeof d === 'number' ? d : (d as DataPoint).value);
  
  if (arr.length < 2) {
    return <svg width={width} height={height}><path d={`M0,${height/2} L${width},${height/2}`} stroke={color} fill="none" strokeWidth="1.5" /></svg>;
  }
  
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  const stepX = width / (arr.length - 1);
  
  let path = '';
  arr.forEach((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height * 0.8 - height * 0.1;
    path += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
  });

  return (
    <svg width={width} height={height}>
      <path d={path} stroke={color} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};