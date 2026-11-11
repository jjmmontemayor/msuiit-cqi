'use client';

import { useState } from 'react';
import type { AcademicTerm } from '@/lib/api';
import { DeleteButton, EditButton } from '@/components/icon-buttons';
import { deleteAcademicTerm, updateAcademicTerm } from './actions';

const input =
  'mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900';

export function TermRow({ term }: { term: AcademicTerm }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li className="px-4 py-3">
        <form
          action={async (formData) => {
            try {
              await updateAcademicTerm(term.id, formData);
              setIsEditing(false);
            } catch {
              // Most likely a term with that year and semester already exists.
              window.alert('Could not save: that academic year and semester may already exist.');
            }
          }}
          className="grid gap-3 sm:grid-cols-3"
        >
          <label className="text-sm">
            Academic year start
            <input
              name="schoolYearStart"
              type="number"
              required
              defaultValue={term.schoolYearStart}
              className={input}
            />
          </label>
          <label className="text-sm">
            Academic year end
            <input
              name="schoolYearEnd"
              type="number"
              required
              defaultValue={term.schoolYearEnd}
              className={input}
            />
          </label>
          <label className="text-sm">
            Semester
            <select name="semester" required defaultValue={term.semester} className={input}>
              <option value="FIRST">First</option>
              <option value="SECOND">Second</option>
              <option value="SUMMER">Summer</option>
            </select>
          </label>
          <div className="flex items-center gap-3 sm:col-span-3">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
            >
              Cancel
            </button>
            <span className="text-xs text-neutral-500">The label is regenerated automatically.</span>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="text-sm">
        <span className="font-medium">
          {term.schoolYearStart}-{term.schoolYearEnd} {term.semester}
        </span>
        <span className="ml-2 text-neutral-600 dark:text-neutral-400">{term.label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <EditButton onClick={() => setIsEditing(true)} />
        <form action={deleteAcademicTerm.bind(null, term.id)}>
          <DeleteButton />
        </form>
      </div>
    </li>
  );
}
