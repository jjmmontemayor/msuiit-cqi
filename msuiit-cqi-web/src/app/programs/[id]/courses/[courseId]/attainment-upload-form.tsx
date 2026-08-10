'use client';

import { useActionState } from 'react';
import {
  uploadAttainmentSheet,
  type UploadAttainmentSheetState,
} from '../../../../admin/actions';
import type { AcademicTerm } from '@/lib/api';

export function AttainmentUploadForm({
  programId,
  courseId,
  academicTerms,
}: {
  programId: string;
  courseId: string;
  academicTerms: AcademicTerm[];
}) {
  const boundAction = uploadAttainmentSheet.bind(null, programId, courseId);
  const [state, formAction, pending] = useActionState<UploadAttainmentSheetState, FormData>(
    boundAction,
    null,
  );

  const academicYears = [
    ...new Map(
      academicTerms.map((t) => [
        `${t.schoolYearStart}-${t.schoolYearEnd}`,
        { start: t.schoolYearStart, end: t.schoolYearEnd },
      ]),
    ).values(),
  ].sort((a, b) => b.start - a.start);

  return (
    <div>
      <h2 className="text-lg font-medium">Upload CLO Attainment Sheet</h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        For the faculty teaching this course this semester. Same layout as
        the source workbook&apos;s CLO_Attainments sheet (ID No. / Student
        Name, then course columns split into CLO1/CLO2/CLO3). Students not
        on this program&apos;s roster are still recorded against the
        course, but won&apos;t appear in any batch-scoped report.
      </p>

      <form
        action={formAction}
        className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
      >
        <label className="text-sm sm:col-span-4">
          Sheet file (.xlsx)
          <input
            name="file"
            type="file"
            accept=".xlsx,.xls"
            required
            className="mt-1 block w-full text-sm"
          />
        </label>

        <label className="text-sm sm:col-span-2">
          Academic year
          <select
            name="schoolYear"
            required
            defaultValue=""
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="" disabled>
              Select&hellip;
            </option>
            {academicYears.map((y) => (
              <option key={`${y.start}-${y.end}`} value={`${y.start}-${y.end}`}>
                {y.start}-{y.end}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Semester
          <select
            name="semester"
            required
            defaultValue=""
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="" disabled>
              Select&hellip;
            </option>
            <option value="FIRST">First</option>
            <option value="SECOND">Second</option>
            <option value="SUMMER">Summer</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-4">
          Section (optional)
          <input
            name="section"
            placeholder="Upload"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        {academicYears.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 sm:col-span-4">
            No academic terms set up yet — ask an admin to{' '}
            <a href="/admin/academic-terms" className="underline">
              add one
            </a>{' '}
            before uploading.
          </p>
        )}

        <div className="sm:col-span-4">
          <button
            type="submit"
            disabled={pending || academicYears.length === 0}
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            {pending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </form>

      {state && 'error' in state && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state && !('error' in state) && (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="font-medium text-emerald-800 dark:text-emerald-300">
            Upload complete
          </p>
          <ul className="mt-2 space-y-0.5 text-neutral-700 dark:text-neutral-300">
            <li>Courses matched: {state.coursesMatched.join(', ') || 'none'}</li>
            {state.coursesSkipped.length > 0 && (
              <li>Courses skipped (not found): {state.coursesSkipped.join(', ')}</li>
            )}
            <li>New students created: {state.studentsCreated}</li>
            <li>Existing students on this program&apos;s roster: {state.studentsExistingInProgram}</li>
            <li>Existing students not on this program&apos;s roster: {state.studentsExistingOutOfProgram}</li>
            <li>Enrollments recorded: {state.enrollmentsRecorded}</li>
            <li>CLO attainments recorded: {state.attainmentsRecorded}</li>
            {state.attainmentsSkippedNoClo > 0 && (
              <li>Scores skipped (no matching CLO defined): {state.attainmentsSkippedNoClo}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
