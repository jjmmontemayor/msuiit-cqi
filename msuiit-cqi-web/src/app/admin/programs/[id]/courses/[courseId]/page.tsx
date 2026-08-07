import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Clo, type Course, type CurriculumCourse, type Program } from '@/lib/api';
import { createClo, deleteClo, updateCourseDetails } from '../../../../actions';

export const dynamic = 'force-dynamic';

type CourseWithClos = Course & { clos: Clo[] };

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

async function getCourse(id: string): Promise<CourseWithClos> {
  try {
    return await apiFetch<CourseWithClos>(`/courses/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
}

export default async function AdminCourseClosPage({
  params,
}: {
  params: Promise<{ id: string; courseId: string }>;
}) {
  const { id, courseId } = await params;
  const [program, course, curriculumCourses] = await Promise.all([
    getProgram(id),
    getCourse(courseId),
    apiFetch<CurriculumCourse[]>(`/curriculum-courses?programId=${id}`),
  ]);

  const otherCourses = curriculumCourses
    .map((cc) => cc.course)
    .filter((c) => c.id !== course.id)
    .sort((a, b) => a.code.localeCompare(b.code));

  const boundCreateClo = createClo.bind(null, program.id, course.id);
  const boundUpdateCourseDetails = updateCourseDetails.bind(null, program.id, course.id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/programs/${program.id}/courses/${course.id}`}
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
        <h2 className="text-lg font-medium">Course Learning Outcomes</h2>
        {course.clos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No CLOs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {course.clos.map((clo) => (
              <li key={clo.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-medium">{clo.code}</span>
                  <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                    {clo.description}
                  </span>
                </div>
                <form action={deleteClo.bind(null, program.id, course.id, clo.id)}>
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
          action={boundCreateClo}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <p className="text-xs text-neutral-500 sm:col-span-4">
            Code is assigned automatically (CLO{course.clos.length + 1}).
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
              placeholder={String(course.clos.length + 1)}
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
      </section>
    </div>
  );
}
