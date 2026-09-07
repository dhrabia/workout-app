// Inclusive numeric range, e.g. generateRange(10, 20, 5) => [10, 15, 20].
export function generateRange(min: number, max: number, step: number): number[] {
  const length = Math.round((max - min) / step) + 1;
  return Array.from({ length }, (_, i) => min + i * step);
}
