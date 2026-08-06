'use client';

import { useState, useTransition } from 'react';
import { setMapping } from './actions';

type Level = 'I' | 'P' | 'D' | '';

const LEVELS: Level[] = ['', 'I', 'P', 'D'];

export function MappingCell({
  programId,
  cohortId,
  cloId,
  ploId,
  initialLevel,
}: {
  programId: string;
  cohortId: string;
  cloId: string;
  ploId: string;
  initialLevel: Level;
}) {
  const [level, setLevel] = useState<Level>(initialLevel);
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={level}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as Level;
        setLevel(next);
        startTransition(async () => {
          await setMapping(programId, cohortId, cloId, ploId, next);
        });
      }}
      className="h-7 w-14 rounded border border-neutral-300 bg-white text-center text-xs font-medium disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
    >
      {LEVELS.map((l) => (
        <option key={l} value={l}>
          {l || '—'}
        </option>
      ))}
    </select>
  );
}
