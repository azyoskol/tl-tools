import React from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  horizontal?: boolean;
  width?: number;
  height?: number;
  color?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  horizontal = false,
  width = 400,
  height = 200,
  color = '#00E5FF'
}) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value));
  const padding = 4;
  const chartW = horizontal ? height : width;
  const chartH = horizontal ? width : height;
  const barSize = (chartW / data.length) - padding;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const barLen = (d.value / max) * chartH;
        if (horizontal) {
          const y = i * (barSize + padding);
          return (
            <g key={i}>
              <rect x="0" y={y} width={barLen} height={barSize} fill={color} rx="2" />
              <text x={barLen + 8} y={y + barSize/2} fill="#E8EDF5" fontSize="11" dominantBaseline="middle">{d.label}</text>
            </g>
          );
        }
        const x = i * (barSize + padding);
        const y = chartH - barLen;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barSize} height={barLen} fill={color} rx="2" />
            <text x={x + barSize/2} y={y - 6} fill="#6B7A9A" fontSize="10" textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};