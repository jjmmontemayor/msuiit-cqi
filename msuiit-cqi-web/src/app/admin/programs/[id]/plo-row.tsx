'use client';

import { useState } from 'react';
import {
  createPerformanceIndicator,
  deletePerformanceIndicator,
  deletePlo,
  updatePerformanceIndicator,
  updatePlo,
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
  const [isEditingPlo, setIsEditingPlo] = useState(false);
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
        <button
          type="button"
          onClick={() => {
            setIsEditingPlo(!isEditingPlo);
            if (!isExpanded) setIsExpanded(true);
          }}
          className="shrink-0 text-sm text-neutral-600 hover:underline dark:text-neutral-400"
        >
          {isEditingPlo ? 'Cancel' : 'Edit'}
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
        <div className="ml-6 mt-2 space-y-3">
          {isEditingPlo && (
            <form
              action={async (formData) => {
                await updatePlo(programId, plo.id, formData);
                setIsEditingPlo(false);
              }}
              className="grid gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-4 dark:border-neutral-800"
            >
              <label className="text-xs sm:col-span-1">
                Code
                <input
                  name="code"
                  required
                  maxLength={20}
                  defaultValue={plo.code}
                  className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-xs sm:col-span-2">
                Description
                <input
                  name="description"
                  required
                  defaultValue={plo.description}
                  className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-xs">
                Display order
                <input
                  name="displayOrder"
                  type="number"
                  defaultValue={plo.displayOrder}
                  className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <div className="sm:col-span-4">
                <button
                  type="submit"
                  className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                >
                  Save PLO
                </button>
              </div>
            </form>
          )}

          {pis.length === 0 ? (
            <p className="text-xs text-neutral-500">No Performance Indicators yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {pis.map((pi) => (
                <PiRow key={pi.id} programId={programId} piId={pi.id} pi={pi} />
              ))}
            </ul>
          )}

          <form
            action={createPerformanceIndicator.bind(null, programId, plo.id)}
            className="grid gap-2 sm:grid-cols-4"
          >
            <label className="text-xs text-neutral-500 sm:col-span-2">
              Add PI (auto-numbered PI{pis.length + 1})
              <input
                name="description"
                required
                placeholder="Describe the performance indicator"
                className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="text-xs text-neutral-500 sm:col-span-2">
              Assessment
              <div className="flex items-end gap-2">
                <input
                  name="assessment"
                  placeholder="How this PI is assessed (optional)"
                  className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  type="submit"
                  className="mt-0.5 shrink-0 rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                >
                  Add
                </button>
              </div>
            </label>
          </form>
        </div>
      )}
    </li>
  );
}

function PiRow({
  programId,
  piId,
  pi,
}: {
  programId: string;
  piId: string;
  pi: NonNullable<Plo['performanceIndicators']>[number];
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li className="px-3 py-2">
        <form
          action={async (formData) => {
            await updatePerformanceIndicator(programId, piId, formData);
            setIsEditing(false);
          }}
          className="grid gap-2 sm:grid-cols-4"
        >
          <div className="text-xs font-medium sm:col-span-4">{pi.code}</div>
          <label className="text-xs text-neutral-500 sm:col-span-2">
            Description
            <input
              name="description"
              required
              defaultValue={pi.description}
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs text-neutral-500 sm:col-span-2">
            Assessment
            <input
              name="assessment"
              defaultValue={pi.assessment ?? ''}
              placeholder="How this PI is assessed (optional)"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="flex gap-3 sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-neutral-600 hover:underline dark:text-neutral-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
      <div>
        <span className="font-medium">{pi.code}</span>
        <span className="ml-2 text-neutral-600 dark:text-neutral-400">{pi.description}</span>
        {pi.assessment && (
          <span className="ml-2 text-xs text-neutral-400">— Assessed via: {pi.assessment}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-xs text-neutral-600 hover:underline dark:text-neutral-400"
        >
          Edit
        </button>
        <form action={deletePerformanceIndicator.bind(null, programId, piId)}>
          <button
            type="submit"
            className="text-xs text-red-600 hover:underline dark:text-red-400"
          >
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
