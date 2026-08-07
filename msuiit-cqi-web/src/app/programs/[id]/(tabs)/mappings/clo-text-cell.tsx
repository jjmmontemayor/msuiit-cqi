'use client';

import { useState, useTransition } from 'react';
import { updateCloText } from '../../../../admin/actions';
import type { Clo } from '@/lib/api';

export function CloTextCell({
  programId,
  courseId,
  clo,
}: {
  programId: string;
  courseId: string;
  clo: Clo;
}) {
  const [description, setDescription] = useState(clo.description);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="text-sm">
      <div className="flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
        {clo.code}
        {clo.isLocked && (
          <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            Locked
          </span>
        )}
      </div>
      {clo.isLocked ? (
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          {clo.description}
        </p>
      ) : (
        <textarea
          value={description}
          disabled={isPending}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            const trimmed = description.trim();
            if (trimmed && trimmed !== clo.description) {
              startTransition(async () => {
                await updateCloText(programId, courseId, clo.id, trimmed);
              });
            }
          }}
          rows={2}
          className="mt-0.5 w-full rounded border border-neutral-300 px-1.5 py-1 text-xs disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
        />
      )}
    </div>
  );
}
