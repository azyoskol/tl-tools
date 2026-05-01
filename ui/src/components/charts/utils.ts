export const seededRand = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const makeTimeSeries = (seed: number, points: number, base: number, variance: number): number[] => {
  const arr: number[] = [];
  let s = seed;
  for (let i = 0; i < points; i++) {
    arr.push(base + (seededRand(s++) - 0.5) * variance * 2);
  }
  return arr;
};

export const bezierPath = (points: number[], width: number, height: number, smooth = 0.2): string => {
  if (points.length < 2) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const scaled = points.map((v, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((v - min) / range) * height
  }));
  let d = `M ${scaled[0].x},${scaled[0].y}`;
  for (let i = 1; i < scaled.length; i++) {
    const prev = scaled[i-1];
    const curr = scaled[i];
    const cp1x = prev.x + (curr.x - prev.x) * smooth;
    const cp1y = prev.y;
    const cp2x = curr.x - (curr.x - prev.x) * smooth;
    const cp2y = curr.y;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
  }
  return d;
};

export const scalePoints = (points: number[], width: number, height: number, minVal?: number, maxVal?: number) => {
  const min = minVal ?? Math.min(...points);
  const max = maxVal ?? Math.max(...points);
  const range = max - min || 1;
  return points.map((v, i) => ({
    x: (i / (points.length - 1 || 1)) * width,
    y: height - ((v - min) / range) * height
  }));
};