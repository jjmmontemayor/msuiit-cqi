'use client';

import { useState, useTransition } from 'react';
import { setMapping } from './actions';
import { LEVEL_SELECT_CLASSES } from '@/lib/mapping-level-colors';

type Level = 'I' | 'P' | 'D' | '';

const LEVELS: Level[] = ['', 'I', 'P', 'D'];

export function MappingCell({
  programId,
  curriculumVersionId,
  cloId,
  ploId,
  initialLevel,
}: {
  programId: string;
  curriculumVersionId: string;
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
          await setMapping(programId, curriculumVersionId, cloId, ploId, next);
        });
      }}
      className={`h-7 w-14 rounded border border-neutral-300 text-center text-xs font-medium disabled:opacity-50 dark:border-neutral-700 ${LEVEL_SELECT_CLASSES[level]}`}
    >
      {LEVELS.map((l) => (
        <option key={l} value={l}>
          {l || '—'}
        </option>
      ))}
    </select>
  );
}
