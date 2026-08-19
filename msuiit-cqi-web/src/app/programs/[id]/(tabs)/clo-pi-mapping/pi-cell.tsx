'use client';

import { useState, useTransition } from 'react';
import { setMappingPi } from './actions';

export function PiToggleCell({
  programCode,
  mappingId,
  piId,
  isSelected,
  initialAssessmentMethod,
}: {
  programCode: string;
  mappingId: string;
  piId: string;
  isSelected: boolean;
  initialAssessmentMethod: string | null;
}) {
  const [assessmentMethod, setAssessmentMethod] = useState(initialAssessmentMethod ?? '');
  const [isPending, startTransition] = useTransition();

  if (!isSelected) {
    return (
      <button
        type="button"
        title="Select this PI"
        aria-label="Select this PI"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await setMappingPi(programCode, mappingId, piId, '');
          });
        }}
        className="flex h-7 w-full items-center justify-center rounded text-neutral-300 hover:bg-neutral-100 hover:text-neutral-500 disabled:opacity-50 dark:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-400"
      >
        &#9675;
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5 py-0.5">
      <button
        type="button"
        title="Unselect this PI"
        aria-label="Unselect this PI"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await setMappingPi(programCode, mappingId, '', '');
          });
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900"
      >
        &#10003;
      </button>
      <input
        value={assessmentMethod}
        disabled={isPending}
        placeholder="Assessment"
        title="Assessment method"
        onChange={(e) => setAssessmentMethod(e.target.value)}
        onBlur={() => {
          if (assessmentMethod !== (initialAssessmentMethod ?? '')) {
            startTransition(async () => {
              await setMappingPi(programCode, mappingId, piId, assessmentMethod);
            });
          }
        }}
        className="h-5 w-20 rounded border border-neutral-300 px-1 text-center text-[10px] disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
      />
    </div>
  );
}
