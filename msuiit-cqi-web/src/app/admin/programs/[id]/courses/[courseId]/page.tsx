import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  apiFetch,
  ApiError,
  type AcademicTerm,
  type Clo,
  type Course,
  type CourseOffering,
  type CurriculumCourse,
  type CurriculumVersion,
  type LearningPlanEntry,
  type Program,
} from '@/lib/api';
import {
  createClo,
  createCourseOffering,
  createLearningPlanEntry,
  deleteClo,
  deleteLearningPlanEntry,
  duplicateCloToVersion,
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
  searchParams: Promise<{ curriculumVersionId?: string; offeringId?: string }>;
}) {
  const { id, courseId } = await params;
  const { curriculumVersionId: versionIdParam, offeringId: offeringIdParam } =
    await searchParams;
  const [program, course, curriculumCourses, curriculumVersions, academicTerms, offerings] =
    await Promise.all([
      getProgram(id),
      getCourse(courseId),
      apiFetch<CurriculumCourse[]>(`/curriculum-courses?programId=${id}`),
      apiFetch<CurriculumVersion[]>(`/curriculum-versions?programId=${id}`),
      apiFetch<AcademicTerm[]>('/academic-terms'),
      apiFetch<CourseOffering[]>(`/course-offerings?courseId=${courseId}`),
    ]);

  const otherCourses = curriculumCourses
    .map((cc) => cc.course)
    .filter((c) => c.id !== course.id)
    .sort((a, b) => a.code.localeCompare(b.code));

  const boundUpdateCourseDetails = updateCourseDetails.bind(null, program.id, course.id);

  const selectedVersionId = versionIdParam || curriculumVersions[0]?.id;
  const clos = selectedVersionId
    ? await apiFetch<Clo[]>(`/clos?courseId=${course.id}&curriculumVersionId=${selectedVersionId}`)
    : [];
  const otherVersions = curriculumVersions.filter((v) => v.id !== selectedVersionId);

  const boundCreateClo = createClo.bind(null, program.id, course.id, selectedVersionId ?? '');

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
          {curriculumVersions.length > 0 && (
            <form method="get" className="flex items-end gap-2">
              <label className="text-sm">
                Curriculum Version
                <select
                  name="curriculumVersionId"
                  defaultValue={selectedVersionId}
                  className="mt-1 block w-48 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {curriculumVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.code}
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

        {curriculumVersions.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No curriculum versions set up for this program yet — CLOs are
            scoped per version, so{' '}
            <Link href={`/admin/programs/${program.id}`} className="underline">
              add one above
            </Link>
            .
          </p>
        ) : clos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No CLOs yet for this curriculum version.</p>
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
                  {otherVersions.length > 0 && (
                    <form
                      action={duplicateCloToVersion.bind(null, program.id, course.id, clo.id)}
                      className="flex items-center gap-1"
                    >
                      <select
                        name="targetCurriculumVersionId"
                        defaultValue=""
                        className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <option value="" disabled>
                          Copy to version&hellip;
                        </option>
                        {otherVersions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.code}
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

        {selectedVersionId && (
          <form
            action={boundCreateClo}
            className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
          >
            <p className="text-xs text-neutral-500 sm:col-span-4">
              Code is assigned automatically (CLO{clos.length + 1}) for the selected curriculum version.
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
              <input
                type="hidden"
                name="curriculumVersionId"
                value={selectedVersionId ?? ''}
              />
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
                  <th className="px-3 py-2" />
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
                    <td className="px-3 py-2">
                      <form
                        action={deleteLearningPlanEntry.bind(
                          null,
                          program.id,
                          course.id,
                          entry.id,
                        )}
                      >
                        <button
                          type="submit"
                          className="text-sm text-red-600 hover:underline dark:text-red-400"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <label className="text-sm">
              CO(s)
              <input
                name="coLabels"
                placeholder="CO1,CO3"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="text-sm">
              Display order
              <input
                name="displayOrder"
                type="number"
                placeholder={String(learningPlanEntries.length + 1)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
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
