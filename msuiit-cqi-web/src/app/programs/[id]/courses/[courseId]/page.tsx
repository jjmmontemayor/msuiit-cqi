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
  AddSyllabus,
  PlanLibrary,
  SyllabusInfoForm,
  sortNewestFirst,
} from "./plan-library";
import { AddEntryForm } from "@/app/admin/programs/[id]/courses/[courseId]/learning-plan/add-entry-form";
import { LearningPlanTable } from "@/app/admin/programs/[id]/courses/[courseId]/learning-plan/learning-plan-table";
import { SyllabusPanel } from "@/app/admin/programs/[id]/courses/[courseId]/learning-plan/syllabus-panel";

export const dynamic = "force-dynamic";

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
  searchParams: Promise<{
    offeringId?: string;
    edit?: string;
    editing?: string;
  }>;
}) {
  const { id, courseId } = await params;
  const {
    offeringId: offeringIdParam,
    edit,
    editing: editingId,
  } = await searchParams;
  const [program, course, allOfferings, academicTerms] = await Promise.all([
    getProgram(id),
    getCourse(courseId),
    apiFetch<CourseOffering[]>(
      `/course-offerings?courseId=${courseId}&archived=include`,
    ),
    apiFetch<AcademicTerm[]>("/academic-terms"),
  ]);
  const offerings = sortNewestFirst(allOfferings);
  // The newest plan that hasn't been archived is the current one.
  const currentOfferingId = offerings.find((o) => !o.archivedAt)?.id;
  const entryCounts = Object.fromEntries(
    await Promise.all(
      offerings.map(
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

  // With a syllabus open, only that syllabus is shown; otherwise the list.
  const selectedOffering = offerings.find((o) => o.id === offeringIdParam);
  const selectedOfferingId = selectedOffering?.id;
  const learningPlanEntries = selectedOfferingId
    ? await apiFetch<LearningPlanEntry[]>(
        `/learning-plan-entries?courseOfferingId=${selectedOfferingId}`,
      )
    : [];
  const tasks = selectedOfferingId
    ? (
        await apiFetch<{ tasks: AssessmentTask[] }>(
          `/course-offerings/${selectedOfferingId}/blueprint`,
        )
      ).tasks
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
            <dd className="mt-0.5">{course.credits ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Lecture hours / week</dt>
            <dd className="mt-0.5">{course.lectureHours ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Lab hours / week</dt>
            <dd className="mt-0.5">{course.labHours ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Prerequisites</dt>
            <dd className="mt-0.5">{course.prerequisites ?? "—"}</dd>
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

      {!selectedOffering ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium">Syllabi</h2>
              <p className="text-sm text-neutral-500">
                One per term and instructor. Each syllabus has its own learning
                plan, assessments and details.
              </p>
            </div>
            <AddSyllabus
              programId={program.id}
              courseId={course.id}
              academicTerms={academicTerms}
            />
          </div>

          {offerings.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              No syllabus yet &mdash; use &ldquo;Add syllabus&rdquo; above.
            </p>
          ) : (
            <PlanLibrary
              programId={program.id}
              courseId={course.id}
              offerings={offerings}
              entryCounts={entryCounts}
              currentId={currentOfferingId}
              editingId={editingId}
              academicTerms={academicTerms}
            />
          )}
        </section>
      ) : (
        // Prototype: the syllabus is editable here without the admin area.
        <section className="space-y-3">
          <div className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-sky-200 bg-sky-50/95 px-4 py-3 shadow-sm backdrop-blur dark:border-sky-900 dark:bg-sky-950/80">
            <Link
              href={`/programs/${program.id}/courses/${course.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                  clipRule="evenodd"
                />
              </svg>
              All syllabi
            </Link>
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-sky-700 dark:text-sky-300">
                {edit === "1" ? "Editing syllabus" : "Syllabus"}
              </div>
              <div className="text-sm font-medium">
                {selectedOffering.academicTerm.label}
                {selectedOffering.section
                  ? ` — ${selectedOffering.section}`
                  : ""}
                {selectedOffering.instructorName
                  ? ` (${selectedOffering.instructorName})`
                  : ""}
              </div>
            </div>
          </div>

          {edit === "1" && (
            <SyllabusInfoForm
              programId={program.id}
              courseId={course.id}
              offering={selectedOffering}
              academicTerms={academicTerms}
            />
          )}

          <h3 className="pt-3 text-base font-medium">Learning plan</h3>
          {learningPlanEntries.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              No learning plan added for this syllabus yet.
            </p>
          ) : (
            <LearningPlanTable
              key={JSON.stringify(learningPlanEntries)}
              programId={program.id}
              courseId={course.id}
              offeringId={selectedOffering.id}
              entries={learningPlanEntries}
              tasks={tasks}
              clos={course.clos}
            />
          )}
          <AddEntryForm
            programId={program.id}
            courseId={course.id}
            offeringId={selectedOffering.id}
            clos={course.clos}
          />
          <SyllabusPanel
            programId={program.id}
            courseId={course.id}
            offering={selectedOffering}
          />
        </section>
      )}

    </div>
  );
}
