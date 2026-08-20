'use client';

import { useState } from 'react';
import {
  createPerformanceIndicator,
  deletePerformanceIndicator,
  deletePlo,
} from '../../actions';
import type { Plo } from '@/lib/api';

export function PloRow({
  programId,
  plo,
}: {
  programId: string;
  plo: Plo;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pis = plo.performanceIndicators ?? [];

  return (
    <li className="px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center gap-2 text-left text-sm"
        >
          <span
            className={`inline-block shrink-0 text-neutral-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            &#9656;
          </span>
          <span>
            <span className="font-medium">{plo.code}</span>
            <span className="ml-2 text-neutral-600 dark:text-neutral-400">
              {plo.description}
            </span>
            <span className="ml-2 text-xs text-neutral-400">
              ({pis.length} PI{pis.length === 1 ? '' : 's'})
            </span>
          </span>
        </button>
        <form action={deletePlo.bind(null, programId, plo.id)}>
          <button
            type="submit"
            className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
          >
            Delete
          </button>
        </form>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-2 space-y-2">
          {pis.length === 0 ? (
            <p className="text-xs text-neutral-500">No Performance Indicators yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {pis.map((pi) => (
                <li
                  key={pi.id}
                  className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
                >
                  <div>
                    <span className="font-medium">{pi.code}</span>
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {pi.description}
                    </span>
                  </div>
                  <form action={deletePerformanceIndicator.bind(null, programId, pi.id)}>
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form
            action={createPerformanceIndicator.bind(null, programId, plo.id)}
            className="flex items-end gap-2"
          >
            <label className="flex-1 text-xs text-neutral-500">
              Add PI (auto-numbered PI{pis.length + 1})
              <input
                name="description"
                required
                placeholder="Describe the performance indicator"
                className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
