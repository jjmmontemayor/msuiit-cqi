'use client';

import { useState } from 'react';
import {
  addCohortAdviser,
  deleteCohort,
  removeCohortAdviser,
  updateCohort,
} from '../../actions';
import type { Cohort, CohortAdviser, Faculty } from '@/lib/api';

export function BatchRow({
  programId,
  cohort,
  advisers,
  availableFaculty,
}: {
  programId: string;
  cohort: Cohort;
  advisers: CohortAdviser[];
  availableFaculty: Faculty[];
}) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSave(formData: FormData) {
    await updateCohort(programId, cohort.id, formData);
    setIsEditing(false);
  }

  return (
    <li className="px-4 py-2.5">
      {isEditing ? (
        <form action={handleSave} className="grid gap-2 sm:grid-cols-4">
          <label className="text-xs text-neutral-500">
            Code
            <input
              name="code"
              required
              maxLength={20}
              defaultValue={cohort.code}
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Start year
            <input
              name="startYear"
              type="number"
              required
              defaultValue={cohort.startYear}
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs text-neutral-500">
            End year
            <input
              name="endYear"
              type="number"
              required
              defaultValue={cohort.endYear}
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Description
            <input
              name="description"
              defaultValue={cohort.description ?? ''}
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="flex items-end gap-3 sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-neutral-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-medium">{cohort.code}</span>
            <span className="ml-2 text-neutral-400">
              {cohort.startYear}&ndash;{cohort.endYear}
            </span>
            {cohort.description && (
              <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                {cohort.description}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm text-neutral-500 hover:underline"
            >
              Edit
            </button>
            <form action={deleteCohort.bind(null, programId, cohort.id)}>
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline dark:text-red-400"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-neutral-500">Advisers:</span>
        {advisers.length === 0 ? (
          <span className="text-xs text-neutral-400">None assigned</span>
        ) : (
          advisers.map((ca) => (
            <span
              key={ca.id}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-0.5 text-xs dark:border-neutral-700"
            >
              {ca.faculty.name}
              <form action={removeCohortAdviser.bind(null, programId, ca.id)}>
                <button
                  type="submit"
                  title="Remove adviser"
                  aria-label="Remove adviser"
                  className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  &times;
                </button>
              </form>
            </span>
          ))
        )}
        {availableFaculty.length > 0 && (
          <form
            action={addCohortAdviser.bind(null, programId, cohort.id)}
            className="flex items-center gap-1"
          >
            <select
              name="facultyId"
              defaultValue=""
              className="rounded border border-neutral-300 px-1.5 py-0.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="" disabled>
                Add adviser&hellip;
              </option>
              {availableFaculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button type="submit" className="text-xs underline">
              Add
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
