import type { MappingLevel } from './api';

// Mapping levels are now an admin-managed, per-program set of any size (not
// a fixed I/P/D triad), so colors are assigned by cycling through a fixed
// palette in ascending weight order rather than keyed by a specific code.
const PALETTE: { badge: string; text: string }[] = [
  { badge: 'bg-blue-600 text-white dark:bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  { badge: 'bg-amber-500 text-white dark:bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  { badge: 'bg-emerald-600 text-white dark:bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  { badge: 'bg-purple-600 text-white dark:bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
  { badge: 'bg-rose-600 text-white dark:bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  { badge: 'bg-cyan-600 text-white dark:bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400' },
];

export const UNSET_LEVEL_SELECT_CLASSES =
  'bg-white text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400';

export interface LevelColors {
  badge: string;
  select: string;
  text: string;
}

export type LevelColorsById = Record<string, LevelColors>;

export function buildLevelColors(mappingLevels: MappingLevel[]): LevelColorsById {
  const sorted = [...mappingLevels].sort((a, b) => a.weight - b.weight);
  const result: LevelColorsById = {};
  sorted.forEach((level, i) => {
    const colors = PALETTE[i % PALETTE.length];
    result[level.id] = { badge: colors.badge, select: colors.badge, text: colors.text };
  });
  return result;
}
