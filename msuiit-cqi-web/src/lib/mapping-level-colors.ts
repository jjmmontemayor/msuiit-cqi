// Consistent color per mapping level across the CLO-PLO mapping views:
// I = Introduced (blue), P = Practiced (amber), D = Demonstrated (green).
export const LEVEL_BADGE_CLASSES: Record<'I' | 'P' | 'D', string> = {
  I: 'bg-blue-600 text-white dark:bg-blue-500',
  P: 'bg-amber-500 text-white dark:bg-amber-500',
  D: 'bg-emerald-600 text-white dark:bg-emerald-500',
};

export const LEVEL_SELECT_CLASSES: Record<'I' | 'P' | 'D' | '', string> = {
  '': 'bg-white text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400',
  I: 'bg-blue-600 text-white dark:bg-blue-500',
  P: 'bg-amber-500 text-white dark:bg-amber-500',
  D: 'bg-emerald-600 text-white dark:bg-emerald-500',
};

// Text-only variant for dense numeric tables (e.g. the I/P/D summary table).
export const LEVEL_TEXT_CLASSES: Record<'I' | 'P' | 'D', string> = {
  I: 'text-blue-600 dark:text-blue-400',
  P: 'text-amber-600 dark:text-amber-400',
  D: 'text-emerald-600 dark:text-emerald-400',
};
