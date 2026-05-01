import React from 'react';

interface MiniSparklineProps {
  data?: { date: string; value: number }[] | number[];
  width?: number;
  height?: number;
  color?: string;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({ width = 100, height = 30, color = '#1976d2' }) => {
  return <svg width={width} height={height}><path d="M0,15 L100,15" stroke={color} fill="none" /></svg>;
};