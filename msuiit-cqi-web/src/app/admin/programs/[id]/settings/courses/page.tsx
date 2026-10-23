import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  apiFetch,
  ApiError,
  type Course,
  type CurriculumCourse,
  type Program,
} from '@/lib/api';
import {
  createAndLinkCourse,
  linkExistingCourse,
  setPloAssessmentTarget,
  unlinkCourse,
} from '../../../../actions';
import { DeleteButton } from '@/components/icon-buttons';

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

export default async function ProgramCoursesSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram(id);

  const [curriculumCourses, allCourses] = await Promise.all([
    apiFetch<CurriculumCourse[]>(`/curriculum-courses?programId=${program.id}`),
    apiFetch<Course[]>('/courses'),
  ]);

  const linkedCourseIds = new Set(curriculumCourses.map((cc) => cc.courseId));
  const availableCourses = allCourses.filter((c) => !linkedCourseIds.has(c.id));

  const boundLinkExistingCourse = linkExistingCourse.bind(null, program.id);
  const boundCreateAndLinkCourse = createAndLinkCourse.bind(null, program.id);

  return (
    <>
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
                  {cc.isPloAssessmentTarget && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      PLO Assessment
                    </span>
                  )}
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <form
                    action={setPloAssessmentTarget.bind(
                      null,
                      program.id,
                      cc.id,
                      !cc.isPloAssessmentTarget,
                    )}
                  >
                    <button
                      type="submit"
                      className="text-sm text-neutral-500 hover:underline dark:text-neutral-400"
                    >
                      {cc.isPloAssessmentTarget
                        ? 'Unmark PLO assessment'
                        : 'Mark for PLO assessment'}
                    </button>
                  </form>
                  <form action={unlinkCourse.bind(null, program.id, cc.id)}>
                    <DeleteButton />
                  </form>
                </div>
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
    </>
  );
}
