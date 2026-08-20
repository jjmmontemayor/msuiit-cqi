import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  apiFetch,
  ApiError,
  type AcademicTerm,
  type Clo,
  type Course,
  type CourseOffering,
  type LearningPlanEntry,
  type Program,
} from '@/lib/api';
import { createCourseOffering, createLearningPlanEntry } from '../../../../../actions';
import { CourseAdminTabs } from '../course-admin-tabs';
import { LearningPlanTable } from './learning-plan-table';

export const dynamic = 'force-dynamic';

async function getProgram(id: string): Promise<Program> {
  try {
    return await apiFetch<Program>(`/programs/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
}

async function getCourse(id: string): Promise<Course> {
  try {
    return await apiFetch<Course>(`/courses/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
}

export default async function AdminCourseLearningPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; courseId: string }>;
  searchParams: Promise<{ offeringId?: string }>;
}) {
  const { id, courseId } = await params;
  const { offeringId: offeringIdParam } = await searchParams;
  const [program, course, academicTerms, offerings, clos] = await Promise.all([
    getProgram(id),
    getCourse(courseId),
    apiFetch<AcademicTerm[]>('/academic-terms'),
    apiFetch<CourseOffering[]>(`/course-offerings?courseId=${courseId}`),
    apiFetch<Clo[]>(`/clos?courseId=${courseId}`),
  ]);

  const selectedOfferingId = offeringIdParam || offerings[0]?.id;
  const learningPlanEntries = selectedOfferingId
    ? await apiFetch<LearningPlanEntry[]>(
        `/learning-plan-entries?courseOfferingId=${selectedOfferingId}`,
      )
    : [];

  const boundCreateCourseOffering = createCourseOffering.bind(null, program.id, course.id);
  const boundCreateLearningPlanEntry = selectedOfferingId
    ? createLearningPlanEntry.bind(null, program.id, course.id, selectedOfferingId)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/programs/${program.code}/courses/${course.id}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; View {course.code}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          {course.code} — {course.title}
        </h1>
      </div>

      <CourseAdminTabs programId={program.id} courseId={course.id} />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">Learning Plan</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Scoped per offering (term + section + instructor) — the same
              course taught by a different instructor or in a different term
              can have an entirely different plan.
            </p>
          </div>
          {offerings.length > 0 && (
            <form method="get" className="flex items-end gap-2">
              <label className="text-sm">
                Offering
                <select
                  name="offeringId"
                  defaultValue={selectedOfferingId}
                  className="mt-1 block w-64 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.academicTerm.label}
                      {o.section ? ` — ${o.section}` : ''}
                      {o.instructorName ? ` (${o.instructorName})` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
              >
                Switch
              </button>
            </form>
          )}
        </div>

        {offerings.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No offerings set up for this course yet — add one below before
            building a learning plan.
          </p>
        ) : learningPlanEntries.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No learning plan entries yet for this offering.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs text-neutral-500">Drag a row by its handle to reorder.</p>
            <LearningPlanTable
              programId={program.id}
              courseId={course.id}
              entries={learningPlanEntries}
            />
          </>
        )}

        {boundCreateLearningPlanEntry && (
          <form
            action={boundCreateLearningPlanEntry}
            className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
          >
            <h3 className="text-sm font-medium sm:col-span-4">Add week entry</h3>
            <label className="text-sm">
              Week label
              <input
                name="weekLabel"
                required
                placeholder="1-4"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="text-sm sm:col-span-3">
              Topics
              <input
                name="topics"
                required
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Lesson learning outcome
              <textarea
                name="lessonOutcome"
                rows={2}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <fieldset className="text-sm sm:col-span-2">
              <legend>CLO(s)</legend>
              {clos.length === 0 ? (
                <p className="mt-1 text-xs text-neutral-500">
                  No CLOs defined yet for this course.
                </p>
              ) : (
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700">
                  {clos.map((clo) => (
                    <label key={clo.id} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        name="cloLabels"
                        value={clo.code}
                        className="rounded border-neutral-300 dark:border-neutral-700"
                      />
                      {clo.code}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <label className="text-sm sm:col-span-2">
              Teaching/learning methodology
              <textarea
                name="methodology"
                rows={2}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Learning resources
              <textarea
                name="learningResources"
                rows={2}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="text-sm sm:col-span-4">
              Assessment
              <input
                name="assessment"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <div className="sm:col-span-4">
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              >
                Add Entry
              </button>
            </div>
          </form>
        )}

        <form
          action={boundCreateCourseOffering}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <h3 className="text-sm font-medium sm:col-span-4">Add offering</h3>
          <label className="text-sm sm:col-span-2">
            Academic term
            <select
              name="academicTermId"
              required
              defaultValue=""
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="" disabled>
                Select&hellip;
              </option>
              {academicTerms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Section
            <input
              name="section"
              maxLength={20}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Instructor
            <input
              name="instructorName"
              maxLength={255}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          {offerings.length > 0 && (
            <label className="text-sm sm:col-span-4">
              Copy learning plan from&hellip; (optional)
              <select
                name="copyLearningPlanFromOfferingId"
                defaultValue=""
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">Don&apos;t copy &mdash; start blank</option>
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.academicTerm.label}
                    {o.section ? ` — ${o.section}` : ''}
                    {o.instructorName ? ` (${o.instructorName})` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          {academicTerms.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 sm:col-span-4">
              No academic terms set up yet — ask an admin to{' '}
              <Link href="/admin/academic-terms" className="underline">
                add one
              </Link>{' '}
              first.
            </p>
          )}
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={academicTerms.length === 0}
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add Offering
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
