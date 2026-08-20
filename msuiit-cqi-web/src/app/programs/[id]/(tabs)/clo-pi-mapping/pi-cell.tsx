'use client';

import { useState, useTransition } from 'react';
import { setCloPiMapping } from './actions';
import { LEVEL_SELECT_CLASSES } from '@/lib/mapping-level-colors';
import type { DisplayCodes } from '@/lib/api';

type Level = 'I' | 'P' | 'D' | '';

const LEVELS: Level[] = ['', 'I', 'P', 'D'];

export function PiLevelCell({
  programCode,
  curriculumVersionId,
  cloId,
  piId,
  initialLevel,
  initialAssessmentMethod,
  displayCodes,
}: {
  programCode: string;
  curriculumVersionId: string;
  cloId: string;
  piId: string;
  initialLevel: Level;
  initialAssessmentMethod: string | null;
  displayCodes: DisplayCodes;
}) {
  const [level, setLevel] = useState<Level>(initialLevel);
  const [assessmentMethod, setAssessmentMethod] = useState(initialAssessmentMethod ?? '');
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center gap-0.5 py-0.5">
      <select
        value={level}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as Level;
          setLevel(next);
          startTransition(async () => {
            await setCloPiMapping(
              programCode,
              curriculumVersionId,
              cloId,
              piId,
              next,
              assessmentMethod,
            );
          });
        }}
        className={`h-7 w-14 rounded border border-neutral-300 text-center text-xs font-medium disabled:opacity-50 dark:border-neutral-700 ${LEVEL_SELECT_CLASSES[level]}`}
      >
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l ? displayCodes[l] : '—'}
          </option>
        ))}
      </select>
      {level && (
        <input
          value={assessmentMethod}
          disabled={isPending}
          placeholder="Assessment"
          title="Assessment method"
          onChange={(e) => setAssessmentMethod(e.target.value)}
          onBlur={() => {
            if (assessmentMethod !== (initialAssessmentMethod ?? '')) {
              startTransition(async () => {
                await setCloPiMapping(
                  programCode,
                  curriculumVersionId,
                  cloId,
                  piId,
                  level,
                  assessmentMethod,
                );
              });
            }
          }}
          className="h-5 w-20 rounded border border-neutral-300 px-1 text-center text-[10px] disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
        />
      )}
    </div>
  );
}
