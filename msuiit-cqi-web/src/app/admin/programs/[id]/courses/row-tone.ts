// Row background by year level (hue) and semester (shade): 1st Sem is the
// lighter tint, 2nd Sem the deeper one, Summer the deepest. Class names are
// spelled out in full so Tailwind can see them.

const TONES: Record<number, [string, string, string]> = {
  1: [
    "bg-sky-50 dark:bg-sky-950/30",
    "bg-sky-100 dark:bg-sky-900/40",
    "bg-sky-200 dark:bg-sky-800/50",
  ],
  2: [
    "bg-emerald-50 dark:bg-emerald-950/30",
    "bg-emerald-100 dark:bg-emerald-900/40",
    "bg-emerald-200 dark:bg-emerald-800/50",
  ],
  3: [
    "bg-amber-50 dark:bg-amber-950/30",
    "bg-amber-100 dark:bg-amber-900/40",
    "bg-amber-200 dark:bg-amber-800/50",
  ],
  4: [
    "bg-rose-50 dark:bg-rose-950/30",
    "bg-rose-100 dark:bg-rose-900/40",
    "bg-rose-200 dark:bg-rose-800/50",
  ],
  5: [
    "bg-violet-50 dark:bg-violet-950/30",
    "bg-violet-100 dark:bg-violet-900/40",
    "bg-violet-200 dark:bg-violet-800/50",
  ],
  6: [
    "bg-cyan-50 dark:bg-cyan-950/30",
    "bg-cyan-100 dark:bg-cyan-900/40",
    "bg-cyan-200 dark:bg-cyan-800/50",
  ],
};

const NONE: [string, string, string] = [
  "bg-neutral-50 dark:bg-neutral-900/30",
  "bg-neutral-100 dark:bg-neutral-900/60",
  "bg-neutral-200 dark:bg-neutral-800/60",
];

export const YEAR_SWATCHES: [number, string][] = [
  [1, "bg-sky-200 dark:bg-sky-800/50"],
  [2, "bg-emerald-200 dark:bg-emerald-800/50"],
  [3, "bg-amber-200 dark:bg-amber-800/50"],
  [4, "bg-rose-200 dark:bg-rose-800/50"],
];

export function rowTone(yearLevel: number | null, term: string | null): string {
  const [first, second, summer] = (yearLevel && TONES[yearLevel]) || NONE;
  if (term === "2nd Sem") return second;
  if (term === "Summer") return summer;
  return first;
}
