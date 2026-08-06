import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  apiFetch,
  ApiError,
  type Cohort,
  type Course,
  type CurriculumCourse,
  type Plo,
  type Program,
} from '@/lib/api';
import {
  createAndLinkCourse,
  createCohort,
  createPlo,
  deleteCohort,
  deletePlo,
  linkExistingCourse,
  unlinkCourse,
} from '../../actions';

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

export default async function AdminProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram(id);

  const [cohorts, plos, curriculumCourses, allCourses] = await Promise.all([
    apiFetch<Cohort[]>(`/cohorts?programId=${program.id}`),
    apiFetch<Plo[]>(`/plos?programId=${program.id}`),
    apiFetch<CurriculumCourse[]>(`/curriculum-courses?programId=${program.id}`),
    apiFetch<Course[]>('/courses'),
  ]);

  const linkedCourseIds = new Set(curriculumCourses.map((cc) => cc.courseId));
  const availableCourses = allCourses.filter((c) => !linkedCourseIds.has(c.id));

  const boundCreateCohort = createCohort.bind(null, program.id);
  const boundCreatePlo = createPlo.bind(null, program.id);
  const boundLinkExistingCourse = linkExistingCourse.bind(null, program.id);
  const boundCreateAndLinkCourse = createAndLinkCourse.bind(null, program.id);

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; Admin
        </Link>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              {program.code} — {program.name}
            </h1>
            {program.description && (
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                {program.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/admin/programs/${program.id}/mappings`}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              Edit CLO-PLO Mapping
            </Link>
            <Link
              href={`/programs/${program.id}`}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              View
            </Link>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium">Batches</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Each batch keeps its own CLO-PLO mapping, since curricula get revised
          between cohorts.
        </p>
        {cohorts.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No batches yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {cohorts.map((cohort) => (
              <li key={cohort.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-medium">{cohort.code}</span>
                  {cohort.description && (
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {cohort.description}
                    </span>
                  )}
                </div>
                <form action={deleteCohort.bind(null, program.id, cohort.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form
          action={boundCreateCohort}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              placeholder="2022-2025"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Start year
            <input
              name="startYear"
              type="number"
              required
              placeholder="2022"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            End year
            <input
              name="endYear"
              type="number"
              required
              placeholder="2025"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Description
            <input
              name="description"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add Batch
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">Program Learning Outcomes</h2>
        {plos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No PLOs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {plos.map((plo) => (
              <li key={plo.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-medium">{plo.code}</span>
                  <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                    {plo.description}
                  </span>
                </div>
                <form action={deletePlo.bind(null, program.id, plo.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form
          action={boundCreatePlo}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              placeholder="PLO1"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm sm:col-span-2">
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
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add PLO
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">Courses in Program</h2>
        {curriculumCourses.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No courses yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {curriculumCourses.map((cc) => (
              <li key={cc.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <Link
                  href={`/admin/programs/${program.id}/courses/${cc.course.id}`}
                  className="text-sm hover:underline"
                >
                  <span className="font-medium">{cc.course.code}</span>
                  <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                    {cc.course.title}
                  </span>
                  <span className="ml-2 text-neutral-400">
                    ({cc.course.clos.length} CLO{cc.course.clos.length === 1 ? '' : 's'})
                  </span>
                  {cc.yearLevel != null && (
                    <span className="ml-2 text-neutral-400">Y{cc.yearLevel}</span>
                  )}
                  {cc.term && <span className="ml-2 text-neutral-400">{cc.term}</span>}
                  {cc.electiveGroup && (
                    <span className="ml-2 text-neutral-400">{cc.electiveGroup}</span>
                  )}
                </Link>
                <form action={unlinkCourse.bind(null, program.id, cc.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <form
            action={boundLinkExistingCourse}
            className="grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <h3 className="text-sm font-medium">Link existing course</h3>
            <label className="text-sm">
              Course
              <select
                name="courseId"
                required
                defaultValue=""
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="" disabled>
                  Select a course&hellip;
                </option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-sm">
                Year
                <input
                  name="yearLevel"
                  type="number"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Term
                <input
                  name="term"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Elective group
                <input
                  name="electiveGroup"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={availableCourses.length === 0}
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Link Course
            </button>
          </form>

          <form
            action={boundCreateAndLinkCourse}
            className="grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <h3 className="text-sm font-medium">Create new course</h3>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">
                Code
                <input
                  name="code"
                  required
                  maxLength={20}
                  placeholder="CS101"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Title
                <input
                  name="title"
                  required
                  maxLength={255}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
            </div>
            <label className="text-sm">
              Description
              <input
                name="description"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-sm">
                Year
                <input
                  name="yearLevel"
                  type="number"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Term
                <input
                  name="term"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Elective group
                <input
                  name="electiveGroup"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
            </div>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Create &amp; Add Course
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
