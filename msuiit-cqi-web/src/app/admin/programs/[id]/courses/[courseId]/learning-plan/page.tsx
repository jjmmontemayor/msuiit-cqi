import Link from "next/link";
import { notFound } from "next/navigation";
import {
  apiFetch,
  ApiError,
  type AcademicTerm,
  type AssessmentTask,
  type Clo,
  type Course,
  type CourseOffering,
  type LearningPlanEntry,
  type Program,
} from "@/lib/api";
import {
  createCourseOffering,
  deleteLearningPlan,
  setLearningPlanArchived,
} from "../../../../../actions";
import { CourseAdminTabs } from "../course-admin-tabs";
import { ConfirmForm } from "./confirm-form";
import { DeleteButton, EyeIcon, iconLinkClass } from "@/components/icon-buttons";
import { LearningPlanTable } from "./learning-plan-table";
import { AddEntryForm } from "./add-entry-form";
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

const SEMESTER_RANK = { FIRST: 1, SECOND: 2, SUMMER: 3 } as const;

const field =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900";
const outlineButton =
  "rounded-md border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";

function offeringLabel(o: CourseOffering) {
  return `${o.academicTerm.label}${o.section ? ` — ${o.section}` : ""}${
    o.instructorName ? ` (${o.instructorName})` : ""
  }`;
}

export default async function AdminCourseSyllabiPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; courseId: string }>;
  searchParams: Promise<{ offeringId?: string }>;
}) {
  const { id, courseId } = await params;
  const { offeringId } = await searchParams;
  const [program, course, academicTerms, fetched, clos] = await Promise.all([
    getProgram(id),
    getCourse(courseId),
    apiFetch<AcademicTerm[]>("/academic-terms"),
    apiFetch<CourseOffering[]>(
      `/course-offerings?courseId=${courseId}&archived=include`,
    ),
    apiFetch<Clo[]>(`/clos?courseId=${courseId}`),
  ]);

  // Newest term first.
  const allOfferings = [...fetched].sort(
    (a, b) =>
      b.academicTerm.schoolYearStart - a.academicTerm.schoolYearStart ||
      SEMESTER_RANK[b.academicTerm.semester] -
        SEMESTER_RANK[a.academicTerm.semester],
  );
  const currentId = allOfferings.find((o) => !o.archivedAt)?.id;
  const selected = allOfferings.find((o) => o.id === offeringId);

  const header = (
    <>
      <div>
        <h1 className="text-2xl font-semibold">
          {course.code} — {course.title}
        </h1>
      </div>
      <CourseAdminTabs programId={program.id} courseId={course.id} />
    </>
  );

  // ---- One syllabus open: its learning plan, assessments and details. ----
  if (selected) {
    const [entries, blueprint] = await Promise.all([
      apiFetch<LearningPlanEntry[]>(
        `/learning-plan-entries?courseOfferingId=${selected.id}`,
      ),
      apiFetch<{ tasks: AssessmentTask[] }>(
        `/course-offerings/${selected.id}/blueprint`,
      ),
    ]);
    const listUrl = `/admin/programs/${program.id}/courses/${course.id}/learning-plan`;

    return (
      <div className="space-y-8">
        {header}
        <section className="space-y-3 bg-sky-50/60 p-4 dark:bg-sky-950/20">
          <div className="flex items-start justify-between gap-4">
            <Link
              href={listUrl}
              className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
            >
              &larr; All syllabi
            </Link>
            <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Syllabus{selected.archivedAt ? " (archived)" : ""}
            </div>
            <div className="text-base font-medium">
              {offeringLabel(selected)}
            </div>
            </div>
          </div>

          <h3 className="pt-3 text-base font-medium">Learning plan</h3>
          {entries.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No learning plan entries yet for this syllabus.
            </p>
          ) : (
            <>
              <p className="text-xs text-neutral-500">
                Drag a row by its handle to reorder.
              </p>
              <LearningPlanTable
                key={JSON.stringify(entries)}
                programId={program.id}
                courseId={course.id}
                offeringId={selected.id}
                entries={entries}
                tasks={blueprint.tasks}
                clos={clos}
                weeks={course.weeks}
              />
            </>
          )}
          <AddEntryForm
            programId={program.id}
            courseId={course.id}
            offeringId={selected.id}
            clos={clos}
            weeks={course.weeks}
          />
          <SyllabusPanel
            programId={program.id}
            courseId={course.id}
            offering={selected}
          />
        </section>
      </div>
    );
  }

  // ---- List of syllabi. ----
  const entryCounts = Object.fromEntries(
    await Promise.all(
      allOfferings.map(
        async (o) =>
          [
            o.id,
            (
              await apiFetch<LearningPlanEntry[]>(
                `/learning-plan-entries?courseOfferingId=${o.id}`,
              )
            ).length,
          ] as const,
      ),
    ),
  );
  const activeOfferings = allOfferings.filter((o) => !o.archivedAt);
  const boundCreateCourseOffering = createCourseOffering.bind(
    null,
    program.id,
    course.id,
  );
  const deleteMessage =
    "Delete this syllabus permanently? Its learning plan, assessment blueprint and enrolled-student records are deleted too. Archive it instead to keep the data.";

  return (
    <div className="space-y-8">
      {header}

      <section>
        <h2 className="text-lg font-medium">Syllabi</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          One syllabus per semester and instructor — the same course taught by a
          different instructor or in a different term can have an entirely
          different plan.
        </p>

        {allOfferings.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            No syllabi yet — add one below (semester + instructor).
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-900">
                <tr>
                  <th className="px-3 py-2 text-left">Academic term</th>
                  <th className="px-3 py-2 text-left">Section</th>
                  <th className="px-3 py-2 text-left">Instructor</th>
                  <th className="px-3 py-2 text-right">Weeks</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {allOfferings.map((o) => {
                  const status = o.archivedAt
                    ? "Archived"
                    : o.id === currentId
                      ? "Current"
                      : "Previous";
                  return (
                    <tr
                      key={o.id}
                      className="border-t border-neutral-200 align-middle dark:border-neutral-800"
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-medium">
                        {o.academicTerm.label}
                      </td>
                      <td className="px-3 py-2">{o.section ?? "—"}</td>
                      <td className="px-3 py-2">{o.instructorName ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {entryCounts[o.id] ?? 0}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            status === "Current"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`?offeringId=${o.id}`}
                            title="Open syllabus"
                            aria-label="Open syllabus"
                            className={iconLinkClass}
                          >
                            <EyeIcon />
                          </Link>
                          <form
                            action={setLearningPlanArchived.bind(
                              null,
                              program.id,
                              course.id,
                              o.id,
                              !o.archivedAt,
                            )}
                          >
                            <button type="submit" className={outlineButton}>
                              {o.archivedAt ? "Restore" : "Archive"}
                            </button>
                          </form>
                          <ConfirmForm
                            action={deleteLearningPlan.bind(
                              null,
                              program.id,
                              course.id,
                              o.id,
                            )}
                            message={deleteMessage}
                          >
                            <DeleteButton title="Delete syllabus" />
                          </ConfirmForm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <form
          action={boundCreateCourseOffering}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <h3 className="text-sm font-medium sm:col-span-4">
            Add syllabus (semester + instructor)
          </h3>
          <label className="text-sm sm:col-span-2">
            Academic term
            <select
              name="academicTermId"
              required
              defaultValue=""
              className={field}
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
            <input name="section" maxLength={20} className={field} />
          </label>
          <label className="text-sm">
            Instructor
            <input name="instructorName" maxLength={255} className={field} />
          </label>
          {activeOfferings.length > 0 && (
            <label className="text-sm sm:col-span-4">
              Copy from syllabus&hellip; (optional)
              <select
                name="copyLearningPlanFromOfferingId"
                defaultValue=""
                className={field}
              >
                <option value="">Don&apos;t copy &mdash; start blank</option>
                {activeOfferings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {offeringLabel(o)}
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
              Add Syllabus
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
