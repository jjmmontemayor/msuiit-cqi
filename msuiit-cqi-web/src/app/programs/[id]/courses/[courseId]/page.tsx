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
  type CurriculumCourse,
  type CurriculumVersion,
  type LearningPlanEntry,
  type OfferingBlueprint,
  type Program,
} from "@/lib/api";
import {
  CheckIcon,
  EyeIcon,
  iconLinkClass,
  PencilIcon,
} from "@/components/icon-buttons";
import { ReadOnlyLearningPlan, SyllabusSummary } from "./syllabus-view";
import { CourseInfo } from "./course-info";
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
    copy?: string;
    copyError?: string;
    curriculumVersionId?: string;
    editCourse?: string;
  }>;
}) {
  const { id, courseId } = await params;
  const {
    offeringId: offeringIdParam,
    edit,
    copy: copySourceId,
    copyError,
    curriculumVersionId: versionIdParam,
    editCourse,
  } = await searchParams;
  // The URL may carry the program code (e.g. BSCS) rather than its id, so resolve
  // the program first and use its real id for the program-scoped queries.
  const program = await getProgram(id);
  const [
    course,
    allOfferings,
    academicTerms,
    curriculumVersions,
    curriculumCourses,
  ] = await Promise.all([
    getCourse(courseId),
    apiFetch<CourseOffering[]>(
      `/course-offerings?courseId=${courseId}&archived=include`,
    ),
    apiFetch<AcademicTerm[]>("/academic-terms"),
    apiFetch<CurriculumVersion[]>(`/curriculum-versions?programId=${program.id}`),
    apiFetch<CurriculumCourse[]>(`/curriculum-courses?programId=${program.id}`),
  ]);
  const selectedVersionId = versionIdParam || curriculumVersions[0]?.id;
  const versionClos = selectedVersionId
    ? await apiFetch<Clo[]>(
        `/clos?courseId=${courseId}&curriculumVersionId=${selectedVersionId}`,
      )
    : [];
  const otherCourses = curriculumCourses
    .map((cc) => cc.course)
    .filter((c) => c.id !== course.id)
    .sort((a, b) => a.code.localeCompare(b.code));
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
  const blueprint = selectedOfferingId
    ? await apiFetch<OfferingBlueprint>(
        `/course-offerings/${selectedOfferingId}/blueprint`,
      )
    : null;
  const tasks: AssessmentTask[] = blueprint?.tasks ?? [];
  const editingSyllabus = edit === "1";

  const editingCourse = editCourse === "1";
  // The page as it is now (open syllabus, edit/copy mode, version), minus the
  // course-edit switch, so editing the course doesn't close the syllabus.
  const keep: Record<string, string> = {};
  if (versionIdParam) keep.curriculumVersionId = versionIdParam;
  if (offeringIdParam) keep.offeringId = offeringIdParam;
  if (edit) keep.edit = edit;
  if (copySourceId) keep.copy = copySourceId;
  const withQuery = (extra: Record<string, string> = {}) => {
    const q = new URLSearchParams({ ...keep, ...extra }).toString();
    return `/programs/${program.id}/courses/${course.id}${q ? `?${q}` : ""}`;
  };
  const courseUrl = withQuery();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/programs/${program.code}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; {program.code}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-semibold">
            {course.code} — {course.title}
          </h1>
          <Link
            href={editingCourse ? courseUrl : withQuery({ editCourse: "1" })}
            title={editingCourse ? "Done editing course" : "Edit course description and details"}
            aria-label={editingCourse ? "Done editing course" : "Edit course description and details"}
            className={iconLinkClass}
          >
            {editingCourse ? <CheckIcon /> : <PencilIcon />}
          </Link>
        </div>
        {!editingCourse && course.description && (
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {course.description}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/40">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Course
        </p>
        <CourseInfo
          programId={program.id}
          course={course}
          otherCourses={otherCourses}
          curriculumVersions={curriculumVersions}
          selectedVersionId={selectedVersionId}
          clos={versionClos}
          editing={editingCourse}
          doneHref={courseUrl}
          preserve={keep}
        />
      </div>

      <div className="border-t border-neutral-300 pt-8 dark:border-neutral-700">
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
              copySourceId={copySourceId}
              copyError={copyError === "1"}
              academicTerms={academicTerms}
            />
          )}
        </section>
      ) : (
        // Prototype: the syllabus is editable here without the admin area.
        <section className="space-y-3 bg-sky-50/60 p-4 dark:bg-sky-950/20">
          <div className="flex items-start justify-between gap-4">
            <Link
              href={`/programs/${program.id}/courses/${course.id}`}
              className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300"
            >
              &larr; All syllabi
            </Link>
            <div className="flex items-start gap-3">
              <div className="text-right">
                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {editingSyllabus ? "Editing syllabus" : "Syllabus"}
                </div>
                <div className="text-base font-medium">
                  {selectedOffering.academicTerm.label}
                  {selectedOffering.section
                    ? ` — ${selectedOffering.section}`
                    : ""}
                  {selectedOffering.instructorName
                    ? ` (${selectedOffering.instructorName})`
                    : ""}
                </div>
              </div>
              <Link
                href={`/programs/${program.id}/courses/${course.id}?offeringId=${selectedOffering.id}${editingSyllabus ? "" : "&edit=1"}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-900"
              >
                {editingSyllabus ? <EyeIcon /> : <PencilIcon />}
                {editingSyllabus ? "View" : "Edit"}
              </Link>
            </div>
          </div>

          {editingSyllabus ? (
            <>
              <SyllabusInfoForm
                programId={program.id}
                courseId={course.id}
                offering={selectedOffering}
                academicTerms={academicTerms}
              />

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
                  clos={versionClos}
                  weeks={course.weeks}
                />
              )}
              <AddEntryForm
                programId={program.id}
                courseId={course.id}
                offeringId={selectedOffering.id}
                clos={versionClos}
                weeks={course.weeks}
              />
              <SyllabusPanel
                programId={program.id}
                courseId={course.id}
                offering={selectedOffering}
              />
            </>
          ) : (
            <>
              <h3 className="pt-3 text-base font-medium">Learning plan</h3>
              <ReadOnlyLearningPlan
                entries={learningPlanEntries}
                tasks={tasks}
              />
              {blueprint && (
                <SyllabusSummary
                  programId={program.id}
                  courseId={course.id}
                  offering={selectedOffering}
                  blueprint={blueprint}
                />
              )}
            </>
          )}
        </section>
      )}
      </div>
    </div>
  );
}
