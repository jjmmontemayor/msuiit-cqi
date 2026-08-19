'use client';

import { useState, useTransition } from 'react';
import { setMappingPi } from './actions';
import type { PerformanceIndicator } from '@/lib/api';

export function PiCell({
  programCode,
  mappingId,
  performanceIndicators,
  initialPiId,
  initialAssessmentMethod,
}: {
  programCode: string;
  mappingId: string;
  performanceIndicators: PerformanceIndicator[];
  initialPiId: string | null;
  initialAssessmentMethod: string | null;
}) {
  const [piId, setPiId] = useState(initialPiId ?? '');
  const [assessmentMethod, setAssessmentMethod] = useState(initialAssessmentMethod ?? '');
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <select
        value={piId}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value;
          setPiId(next);
          startTransition(async () => {
            await setMappingPi(programCode, mappingId, next, assessmentMethod);
          });
        }}
        className="h-7 w-full rounded border border-neutral-300 px-1 text-xs disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="">— No PI —</option>
        {performanceIndicators.map((pi) => (
          <option key={pi.id} value={pi.id} title={pi.description}>
            {pi.code}
          </option>
        ))}
      </select>
      <input
        value={assessmentMethod}
        disabled={isPending}
        placeholder="Assessment method"
        onChange={(e) => setAssessmentMethod(e.target.value)}
        onBlur={() => {
          if (assessmentMethod !== (initialAssessmentMethod ?? '')) {
            startTransition(async () => {
              await setMappingPi(programCode, mappingId, piId, assessmentMethod);
            });
          }
        }}
        className="h-6 w-full rounded border border-neutral-300 px-1 text-xs disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
      />
    </div>
  );
}
