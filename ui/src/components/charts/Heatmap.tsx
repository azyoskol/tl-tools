import React from 'react';

interface HeatmapProps {
  data: number[][];
  width?: number;
  height?: number;
  colorScale?: string[];
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  width = 300,
  height = 100,
  colorScale = ['#131825', '#00E5FF']
}) => {
  const rows = data.length;
  const cols = data[0]?.length || 0;
  const cellW = width / cols;
  const cellH = height / rows;
  const max = Math.max(...data.flat());
  const min = Math.min(...data.flat());

  const getColor = (val: number) => {
    const t = max === min ? 0.5 : (val - min) / (max - min);
    const r = Math.round(parseInt(colorScale[0].slice(1,3), 16) * (1-t) + parseInt(colorScale[1].slice(1,3), 16) * t);
    const g = Math.round(parseInt(colorScale[0].slice(3,5), 16) * (1-t) + parseInt(colorScale[1].slice(3,5), 16) * t);
    const b = Math.round(parseInt(colorScale[0].slice(5,7), 16) * (1-t) + parseInt(colorScale[1].slice(5,7), 16) * t);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((row, ri) =>
        row.map((val, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={ci * cellW}
            y={ri * cellH}
            width={cellW - 1}
            height={cellH - 1}
            fill={getColor(val)}
            rx="2"
          />
        ))
      )}
    </svg>
  );
};