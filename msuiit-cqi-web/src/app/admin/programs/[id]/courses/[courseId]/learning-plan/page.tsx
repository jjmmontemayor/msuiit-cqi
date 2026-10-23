import Link from "next/link";
import { notFound } from "next/navigation";
import {
  apiFetch,
  ApiError,
  type AcademicTerm,
  type Clo,
  type Course,
  type CourseOffering,
  type LearningPlanEntry,
  type Program,
} from "@/lib/api";
import {
  createCourseOffering,
  createLearningPlanEntry,
} from "../../../../../actions";
import { CourseAdminTabs } from "../course-admin-tabs";
import { LearningPlanTable } from "./learning-plan-table";
import { SyllabusPanel } from "./syllabus-panel";

export const dynamic = "force-dynamic";

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

function AddEntryForm({
  programId,
  courseId,
  offeringId,
  clos,
}: {
  programId: string;
  courseId: string;
  offeringId: string;
  clos: Clo[];
}) {
  return (
    <form
      action={createLearningPlanEntry.bind(
        null,
        programId,
        courseId,
        offeringId,
      )}
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
  );
}

export default async function AdminCourseLearningPlanPage({
  params,
}: {
  params: Promise<{ id: string; courseId: string }>;
}) {
  const { id, courseId } = await params;
  const [program, course, academicTerms, offerings, clos] = await Promise.all([
    getProgram(id),
    getCourse(courseId),
    apiFetch<AcademicTerm[]>("/academic-terms"),
    apiFetch<CourseOffering[]>(`/course-offerings?courseId=${courseId}`),
    apiFetch<Clo[]>(`/clos?courseId=${courseId}`),
  ]);

  const entriesByOffering = new Map(
    await Promise.all(
      offerings.map(
        async (o) =>
          [
            o.id,
            await apiFetch<LearningPlanEntry[]>(
              `/learning-plan-entries?courseOfferingId=${o.id}`,
            ),
          ] as const,
      ),
    ),
  );

  const boundCreateCourseOffering = createCourseOffering.bind(
    null,
    program.id,
    course.id,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {course.code} — {course.title}
        </h1>
      </div>

      <CourseAdminTabs programId={program.id} courseId={course.id} />

      <section>
        <h2 className="text-lg font-medium">Learning Plans</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          One plan per semester and instructor — the same course taught by a
          different instructor or in a different term can have an entirely
          different plan.
        </p>

        {offerings.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No learning plans yet — add an offering below (semester +
            instructor) to start one.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {offerings.map((o, i) => {
              const entries = entriesByOffering.get(o.id) ?? [];
              return (
                <details
                  key={o.id}
                  open={i === 0}
                  className="rounded-md border border-neutral-200 dark:border-neutral-800"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span>
                      <span className="font-medium">
                        {o.academicTerm.label}
                      </span>
                      {o.section && (
                        <span className="ml-2 text-neutral-500">
                          Section {o.section}
                        </span>
                      )}
                      <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                        {o.instructorName ?? "No instructor set"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-neutral-500">
                      {entries.length}{" "}
                      {entries.length === 1 ? "entry" : "entries"}
                    </span>
                  </summary>
                  <div className="space-y-3 border-t border-neutral-200 p-4 dark:border-neutral-800">
                    {entries.length === 0 ? (
                      <p className="text-sm text-neutral-500">
                        No learning plan entries yet for this offering.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-neutral-500">
                          Drag a row by its handle to reorder.
                        </p>
                        <LearningPlanTable
                          programId={program.id}
                          courseId={course.id}
                          entries={entries}
                        />
                      </>
                    )}
                    <SyllabusPanel
                      programId={program.id}
                      courseId={course.id}
                      offering={o}
                    />
                    <AddEntryForm
                      programId={program.id}
                      courseId={course.id}
                      offeringId={o.id}
                      clos={clos}
                    />
                  </div>
                </details>
              );
            })}
          </div>
        )}

        <form
          action={boundCreateCourseOffering}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <h3 className="text-sm font-medium sm:col-span-4">
            Add learning plan (semester + instructor)
          </h3>
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
                    {o.section ? ` — ${o.section}` : ""}
                    {o.instructorName ? ` (${o.instructorName})` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          {academicTerms.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 sm:col-span-4">
              No academic terms set up yet — ask an admin to{" "}
              <Link href="/admin/academic-terms" className="underline">
                add one
              </Link>{" "}
              first.
            </p>
          )}
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={academicTerms.length === 0}
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add Plan
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
