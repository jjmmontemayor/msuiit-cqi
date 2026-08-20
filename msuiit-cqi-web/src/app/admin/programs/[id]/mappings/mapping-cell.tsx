'use client';

import { useState, useTransition } from 'react';
import { setMapping } from './actions';
import { UNSET_LEVEL_SELECT_CLASSES, type LevelColorsById } from '@/lib/mapping-level-colors';
import type { MappingLevel } from '@/lib/api';

export function MappingCell({
  programId,
  curriculumVersionId,
  cloId,
  ploId,
  initialMappingLevelId,
  mappingLevels,
  levelColors,
}: {
  programId: string;
  curriculumVersionId: string;
  cloId: string;
  ploId: string;
  initialMappingLevelId: string;
  mappingLevels: MappingLevel[];
  levelColors: LevelColorsById;
}) {
  const [mappingLevelId, setMappingLevelId] = useState(initialMappingLevelId);
  const [isPending, startTransition] = useTransition();
  const selectClass = mappingLevelId
    ? (levelColors[mappingLevelId]?.select ?? UNSET_LEVEL_SELECT_CLASSES)
    : UNSET_LEVEL_SELECT_CLASSES;

  return (
    <select
      value={mappingLevelId}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value;
        setMappingLevelId(next);
        startTransition(async () => {
          await setMapping(programId, curriculumVersionId, cloId, ploId, next);
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
  );
}
