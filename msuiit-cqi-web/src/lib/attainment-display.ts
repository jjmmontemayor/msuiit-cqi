import type { Cohort } from './api';

// One tint per batch so rows are visually distinguishable in an "all
// batches" view. Cycles if there are more cohorts than colors.
export const BATCH_COLORS = [
  { swatch: 'bg-blue-200 dark:bg-blue-800', row: 'bg-blue-50 dark:bg-blue-950/40' },
  { swatch: 'bg-emerald-200 dark:bg-emerald-800', row: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { swatch: 'bg-amber-200 dark:bg-amber-800', row: 'bg-amber-50 dark:bg-amber-950/40' },
  { swatch: 'bg-purple-200 dark:bg-purple-800', row: 'bg-purple-50 dark:bg-purple-950/40' },
  { swatch: 'bg-pink-200 dark:bg-pink-800', row: 'bg-pink-50 dark:bg-pink-950/40' },
  { swatch: 'bg-cyan-200 dark:bg-cyan-800', row: 'bg-cyan-50 dark:bg-cyan-950/40' },
];

export function buildBatchColorMap(cohorts: Cohort[]): Map<string, (typeof BATCH_COLORS)[number]> {
  const map = new Map<string, (typeof BATCH_COLORS)[number]>();
  cohorts.forEach((c, i) => {
    map.set(c.id, BATCH_COLORS[i % BATCH_COLORS.length]);
  });
  return map;
}

export function belowBenchmarkClass(score: number, benchmarkPercentage: number): string {
  return score < benchmarkPercentage
    ? 'bg-red-100 text-red-800 font-medium dark:bg-red-950/60 dark:text-red-300'
    : '';
}
