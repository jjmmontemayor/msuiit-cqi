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
import { DownloadAttainmentTemplate } from './download-attainment-template';
import { AttainmentUploadForm } from './attainment-upload-form';

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
  searchParams,
}: {
  params: Promise<{ id: string; courseId: string }>;
  searchParams: Promise<{ offeringId?: string }>;
}) {
  const { id, courseId } = await params;
  const { offeringId: offeringIdParam } = await searchParams;
  const [program, course, academicTerms, offerings] = await Promise.all([
    getProgram(id),
    getCourse(courseId),
    apiFetch<AcademicTerm[]>('/academic-terms'),
    apiFetch<CourseOffering[]>(`/course-offerings?courseId=${courseId}`),
  ]);

  const selectedOfferingId = offeringIdParam || offerings[0]?.id;
  const learningPlanEntries = selectedOfferingId
    ? await apiFetch<LearningPlanEntry[]>(
        `/learning-plan-entries?courseOfferingId=${selectedOfferingId}`,
      )
    : [];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/programs/${program.code}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; {program.code}
        </Link>
        <div className="mt-1 flex items-start gap-2">
          <h1 className="text-2xl font-semibold">
            {course.code} — {course.title}
          </h1>
          <Link
            href={`/admin/programs/${program.id}/courses/${course.id}`}
            title="Edit course"
            aria-label="Edit course"
            className="mt-1 shrink-0 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
            </svg>
          </Link>
        </div>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Course Learning Outcomes</h2>
          {course.clos.length > 0 && (
            <DownloadAttainmentTemplate courseCode={course.code} clos={course.clos} />
          )}
        </div>
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

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-medium">Learning Plan</h2>
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
                View
              </button>
            </form>
          )}
        </div>

        {offerings.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No offerings set up for this course yet.
          </p>
        ) : learningPlanEntries.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No learning plan added for this offering yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-900">
                <tr>
                  <th className="px-3 py-2 text-left">Week</th>
                  <th className="px-3 py-2 text-left">Topics</th>
                  <th className="px-3 py-2 text-left">Lesson Outcome</th>
                  <th className="px-3 py-2 text-left">CO</th>
                  <th className="px-3 py-2 text-left">Methodology</th>
                  <th className="px-3 py-2 text-left">Resources</th>
                  <th className="px-3 py-2 text-left">Assessment</th>
                </tr>
              </thead>
              <tbody>
                {learningPlanEntries.map((entry) => (
                  <tr key={entry.id} className="border-t border-neutral-200 align-top dark:border-neutral-800">
                    <td className="whitespace-nowrap px-3 py-2 font-medium">{entry.weekLabel}</td>
                    <td className="px-3 py-2">{entry.topics}</td>
                    <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                      {entry.lessonOutcome}
                    </td>
                    <td className="px-3 py-2">{entry.coLabels}</td>
                    <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                      {entry.methodology}
                    </td>
                    <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                      {entry.learningResources}
                    </td>
                    <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                      {entry.assessment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <AttainmentUploadForm
          programId={program.id}
          courseId={course.id}
          academicTerms={academicTerms}
        />
      </section>
    </div>
  );
}
