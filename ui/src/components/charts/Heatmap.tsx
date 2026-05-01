import React from 'react';

interface HeatmapProps {
  data?: unknown[];
  width?: number;
  height?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ width = 400, height = 200 }) => {
  return <div style={{ width, height }}>Heatmap</div>;
};