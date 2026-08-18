import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Clo, type Cohort, type Course, type CurriculumCourse, type Program } from '@/lib/api';
import {
  createClo,
  deleteClo,
  duplicateCloToCohort,
  setCloLock,
  updateCourseDetails,
} from '../../../../actions';

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

export default async function AdminCourseClosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; courseId: string }>;
  searchParams: Promise<{ cohortId?: string }>;
}) {
  const { id, courseId } = await params;
  const { cohortId: cohortIdParam } = await searchParams;
  const [program, course, curriculumCourses, cohorts] = await Promise.all([
    getProgram(id),
    getCourse(courseId),
    apiFetch<CurriculumCourse[]>(`/curriculum-courses?programId=${id}`),
    apiFetch<Cohort[]>(`/cohorts?programId=${id}`),
  ]);

  const otherCourses = curriculumCourses
    .map((cc) => cc.course)
    .filter((c) => c.id !== course.id)
    .sort((a, b) => a.code.localeCompare(b.code));

  const boundUpdateCourseDetails = updateCourseDetails.bind(null, program.id, course.id);

  const selectedCohortId = cohortIdParam || cohorts[0]?.id;
  const clos = selectedCohortId
    ? await apiFetch<Clo[]>(`/clos?courseId=${course.id}&cohortId=${selectedCohortId}`)
    : [];
  const otherCohorts = cohorts.filter((c) => c.id !== selectedCohortId);

  const boundCreateClo = createClo.bind(null, program.id, course.id, selectedCohortId ?? '');

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

      <section>
        <h2 className="text-lg font-medium">Course Details</h2>
        <form
          action={boundUpdateCourseDetails}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              defaultValue={course.code}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm sm:col-span-3">
            Title
            <input
              name="title"
              required
              maxLength={255}
              defaultValue={course.title}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm sm:col-span-4">
            Description
            <textarea
              name="description"
              rows={3}
              defaultValue={course.description ?? ''}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Credits (units)
            <input
              name="credits"
              type="number"
              min={0}
              defaultValue={course.credits ?? ''}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Lecture hours / week
            <input
              name="lectureHours"
              type="number"
              min={0}
              defaultValue={course.lectureHours ?? ''}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Lab hours / week
            <input
              name="labHours"
              type="number"
              min={0}
              defaultValue={course.labHours ?? ''}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Prerequisites
            <select
              name="prerequisites"
              defaultValue={course.prerequisites ?? ''}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">None</option>
              {otherCourses.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Save Details
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-medium">Course Learning Outcomes</h2>
          {cohorts.length > 0 && (
            <form method="get" className="flex items-end gap-2">
              <label className="text-sm">
                Batch
                <select
                  name="cohortId"
                  defaultValue={selectedCohortId}
                  className="mt-1 block w-48 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
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

        {cohorts.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No batches set up for this program yet — CLOs are scoped per batch, so{' '}
            <Link href={`/admin/programs/${program.id}`} className="underline">
              add one above
            </Link>
            .
          </p>
        ) : clos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No CLOs yet for this batch.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {clos.map((clo) => (
              <li key={clo.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-medium">{clo.code}</span>
                  {clo.isLocked && (
                    <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      Locked
                    </span>
                  )}
                  <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                    {clo.description}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {otherCohorts.length > 0 && (
                    <form
                      action={duplicateCloToCohort.bind(null, program.id, course.id, clo.id)}
                      className="flex items-center gap-1"
                    >
                      <select
                        name="targetCohortId"
                        defaultValue=""
                        className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <option value="" disabled>
                          Copy to batch&hellip;
                        </option>
                        {otherCohorts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="text-xs text-neutral-600 hover:underline dark:text-neutral-400"
                      >
                        Copy
                      </button>
                    </form>
                  )}
                  <form action={setCloLock.bind(null, program.id, course.id, clo.id, !clo.isLocked)}>
                    <button
                      type="submit"
                      className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
                    >
                      {clo.isLocked ? 'Unlock' : 'Lock'}
                    </button>
                  </form>
                  {!clo.isLocked && (
                    <form action={deleteClo.bind(null, program.id, course.id, clo.id)}>
                      <button
                        type="submit"
                        className="text-sm text-red-600 hover:underline dark:text-red-400"
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {selectedCohortId && (
          <form
            action={boundCreateClo}
            className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
          >
            <p className="text-xs text-neutral-500 sm:col-span-4">
              Code is assigned automatically (CLO{clos.length + 1}) for the selected batch.
            </p>
            <label className="text-sm sm:col-span-3">
              Description
              <input
                name="description"
                required
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="text-sm">
              Display order
              <input
                name="displayOrder"
                type="number"
                placeholder={String(clos.length + 1)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <div className="sm:col-span-4">
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              >
                Add CLO
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
