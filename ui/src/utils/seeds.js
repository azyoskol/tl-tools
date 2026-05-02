export const seededRand = (seed) => {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
};
export const makeTimeSeries = (n, base, variance, trend = 0, seed = 42) => {
  const r = seededRand(seed);
  return Array.from({ length: n }, (_, i) => Math.max(0, base + trend * i + (r() - 0.5) * variance * 2));
};
export const makeHeatData = (rows, cols, density = 0.4, seed = 77) => {
  const r = seededRand(seed);
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => r() < density ? Math.floor(r() * 5) + 1 : 0));
};