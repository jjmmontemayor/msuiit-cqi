import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Clo, type Course, type Program } from '@/lib/api';

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

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ id: string; courseId: string }>;
}) {
  const { id, courseId } = await params;
  const [program, course] = await Promise.all([getProgram(id), getCourse(courseId)]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/programs/${program.id}/mappings`}
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; {program.code}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          {course.code} — {course.title}
        </h1>
        {course.description && (
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {course.description}
          </p>
        )}
      </div>

      <section>
        <h2 className="text-lg font-medium">Course Details</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 rounded-md border border-neutral-200 p-4 text-sm sm:grid-cols-4 dark:border-neutral-800">
          <div>
            <dt className="text-neutral-500">Credits</dt>
            <dd className="mt-0.5">{course.credits ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Lecture hours / week</dt>
            <dd className="mt-0.5">{course.lectureHours ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Lab hours / week</dt>
            <dd className="mt-0.5">{course.labHours ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Prerequisites</dt>
            <dd className="mt-0.5">{course.prerequisites ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-medium">Course Learning Outcomes</h2>
        {course.clos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No CLOs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {course.clos.map((clo) => (
              <li key={clo.id} className="px-4 py-2.5 text-sm">
                <span className="font-medium">{clo.code}</span>
                <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                  {clo.description}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
