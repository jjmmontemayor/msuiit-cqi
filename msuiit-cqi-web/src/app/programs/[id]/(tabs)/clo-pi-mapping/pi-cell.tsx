'use client';

import { useState, useTransition } from 'react';
import { setCloPiMapping } from './actions';
import { UNSET_LEVEL_SELECT_CLASSES, type LevelColorsById } from '@/lib/mapping-level-colors';
import type { MappingLevel } from '@/lib/api';

export function PiLevelCell({
  programCode,
  curriculumVersionId,
  cloId,
  piId,
  initialMappingLevelId,
  initialAssessmentMethod,
  mappingLevels,
  levelColors,
}: {
  programCode: string;
  curriculumVersionId: string;
  cloId: string;
  piId: string;
  initialMappingLevelId: string;
  initialAssessmentMethod: string | null;
  mappingLevels: MappingLevel[];
  levelColors: LevelColorsById;
}) {
  const [mappingLevelId, setMappingLevelId] = useState(initialMappingLevelId);
  const [assessmentMethod, setAssessmentMethod] = useState(initialAssessmentMethod ?? '');
  const [isPending, startTransition] = useTransition();
  const selectClass = mappingLevelId
    ? (levelColors[mappingLevelId]?.select ?? UNSET_LEVEL_SELECT_CLASSES)
    : UNSET_LEVEL_SELECT_CLASSES;

  return (
    <div className="flex flex-col items-center gap-0.5 py-0.5">
      <select
        value={mappingLevelId}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value;
          setMappingLevelId(next);
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
        className={`h-7 w-14 rounded border border-neutral-300 text-center text-xs font-medium disabled:opacity-50 dark:border-neutral-700 ${selectClass}`}
      >
        <option value="">&mdash;</option>
        {mappingLevels.map((level) => (
          <option key={level.id} value={level.id}>
            {level.displayCode}
          </option>
        ))}
      </select>
      {mappingLevelId && (
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
                  mappingLevelId,
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
