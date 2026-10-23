import {
  apiFetch,
  type CourseOffering,
  type OfferingBlueprint,
} from "@/lib/api";
import {
  addAssessmentTask,
  deleteAssessmentTask,
  saveOfferingClo,
  updateAssessmentTask,
  updateOfferingSyllabusDetails,
} from "../../../../../actions";
import { AutoSubmitInput } from "@/components/auto-submit-input";
import { DeleteButton } from "@/components/icon-buttons";

const input =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900";
const cellInput =
  "w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900";
const exportLink =
  "rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";

// Syllabus details, the assessment blueprint and the exports for one offering.
export async function SyllabusPanel({
  programId,
  courseId,
  offering,
}: {
  programId: string;
  courseId: string;
  offering: CourseOffering;
}) {
  const blueprint = await apiFetch<OfferingBlueprint>(
    `/course-offerings/${offering.id}/blueprint`,
  );
  const base = `/admin/programs/${programId}/courses/${courseId}/learning-plan/export?offeringId=${offering.id}`;

  const cloWeightTotal = blueprint.clos.reduce(
    (sum, { setting }) => sum + (setting?.weight ?? 0),
    0,
  );
  const taskTotal = (cloId: string) =>
    blueprint.tasks
      .filter((t) => t.cloId === cloId)
      .reduce((sum, t) => sum + t.weight, 0);

  return (
    <div className="space-y-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Syllabus &amp; grading sheet</h3>
        <div className="flex flex-wrap gap-2">
          <a href={`${base}&kind=syllabus&format=pdf`} className={exportLink}>
            Syllabus PDF
          </a>
          <a
            href={`${base}&kind=grading-sheet&format=xlsx`}
            className={exportLink}
          >
            Grading sheet (.xlsx)
          </a>
          <a
            href={`${base}&kind=grading-sheet&format=csv`}
            className={exportLink}
          >
            Grading sheet (.csv)
          </a>
        </div>
      </div>

      <details className="rounded-md border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
          Syllabus details
        </summary>
        <form
          action={updateOfferingSyllabusDetails.bind(
            null,
            programId,
            courseId,
            offering.id,
          )}
          className="grid gap-3 border-t border-neutral-200 p-3 sm:grid-cols-4 dark:border-neutral-800"
        >
          <label className="text-sm sm:col-span-2">
            Modality
            <input
              name="modality"
              defaultValue={offering.modality ?? ""}
              placeholder="Blended Learning"
              className={input}
            />
          </label>
          <label className="text-sm">
            Population (students)
            <input
              name="population"
              type="number"
              min={0}
              defaultValue={offering.population ?? ""}
              className={input}
            />
          </label>
          <label className="text-sm">
            Coursework weight (%)
            <input
              name="courseworkWeight"
              type="number"
              min={0}
              max={100}
              defaultValue={offering.courseworkWeight}
              className={input}
            />
          </label>
          <label className="text-sm sm:col-span-4">
            Textbooks / references (one per line)
            <textarea
              name="references"
              rows={3}
              defaultValue={offering.references ?? ""}
              className={input}
            />
          </label>
          <label className="text-sm sm:col-span-4">
            Classroom policies
            <textarea
              name="classroomPolicies"
              rows={2}
              defaultValue={offering.classroomPolicies ?? ""}
              placeholder="Leave blank to refer to the Student's Handbook"
              className={input}
            />
          </label>
          <label className="text-sm">
            Prepared by
            <input
              name="preparedBy"
              defaultValue={offering.preparedBy ?? ""}
              placeholder={offering.instructorName ?? ""}
              className={input}
            />
          </label>
          <label className="text-sm">
            Reviewed by
            <input
              name="reviewedBy"
              defaultValue={offering.reviewedBy ?? ""}
              className={input}
            />
          </label>
          <label className="text-sm">
            Approved by
            <input
              name="approvedBy"
              defaultValue={offering.approvedBy ?? ""}
              className={input}
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Save details
            </button>
          </div>
        </form>
      </details>

      <details className="rounded-md border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
          Assessment blueprint (CLO weights &amp; assessment tasks)
        </summary>
        <div className="space-y-4 border-t border-neutral-200 p-3 dark:border-neutral-800">
          {blueprint.clos.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No CLOs defined yet for this course.
            </p>
          ) : (
            <>
              <p className="text-xs text-neutral-500">
                Pick the assessments that compute each CLO. A CLO&apos;s tasks
                should total 100%, and the CLO weights should total 100%.
                Changes save when you leave a field.
              </p>
              {cloWeightTotal !== 100 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  CLO weights total {cloWeightTotal}% (should be 100%).
                </p>
              )}

              {blueprint.clos.map(({ clo, setting }) => {
                const tasks = blueprint.tasks.filter((t) => t.cloId === clo.id);
                const total = taskTotal(clo.id);
                return (
                  <div
                    key={clo.id}
                    className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                  >
                    <form
                      action={saveOfferingClo.bind(
                        null,
                        programId,
                        courseId,
                        offering.id,
                        clo.id,
                      )}
                      className="grid gap-2 sm:grid-cols-6"
                    >
                      <div className="text-sm sm:col-span-6">
                        <span className="font-medium">{clo.code}</span>
                        <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                          {clo.description}
                        </span>
                      </div>
                      <label className="text-xs">
                        CLO weight (%)
                        <AutoSubmitInput
                          name="weight"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={setting?.weight ?? 0}
                          className={cellInput}
                        />
                      </label>
                      <label className="text-xs sm:col-span-2">
                        Learning taxonomy
                        <AutoSubmitInput
                          name="taxonomy"
                          defaultValue={setting?.taxonomy ?? ""}
                          placeholder="Apply, Analyze"
                          className={cellInput}
                        />
                      </label>
                      <label className="text-xs sm:col-span-3">
                        Rubric / evidence reference
                        <AutoSubmitInput
                          name="evidenceReference"
                          defaultValue={setting?.evidenceReference ?? ""}
                          placeholder="Seatworks and quizzes, MCQ type exam"
                          className={cellInput}
                        />
                      </label>
                    </form>

                    {tasks.length > 0 && (
                      <div className="space-y-1">
                        <div className="grid grid-cols-[1fr_5rem_5rem_2rem] gap-2 text-xs text-neutral-500">
                          <span>Assessment task</span>
                          <span>Weight (%)</span>
                          <span>Max score</span>
                          <span />
                        </div>
                        {tasks.map((t) => (
                          <form
                            key={t.id}
                            action={updateAssessmentTask.bind(
                              null,
                              programId,
                              courseId,
                              t.id,
                            )}
                            className="grid grid-cols-[1fr_5rem_5rem_2rem] items-center gap-2"
                          >
                            <AutoSubmitInput
                              name="name"
                              defaultValue={t.name}
                              required
                              className={cellInput}
                            />
                            <AutoSubmitInput
                              name="weight"
                              type="number"
                              min={0}
                              max={100}
                              defaultValue={t.weight}
                              className={cellInput}
                            />
                            <AutoSubmitInput
                              name="maxScore"
                              type="number"
                              min={1}
                              defaultValue={t.maxScore}
                              className={cellInput}
                            />
                            <DeleteButton
                              title="Delete task"
                              formAction={deleteAssessmentTask.bind(
                                null,
                                programId,
                                courseId,
                                t.id,
                              )}
                            />
                          </form>
                        ))}
                      </div>
                    )}
                    {tasks.length > 0 && total !== 100 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {clo.code} tasks total {total}% (should be 100%).
                      </p>
                    )}

                    <form
                      action={addAssessmentTask.bind(
                        null,
                        programId,
                        courseId,
                        offering.id,
                      )}
                      className="grid grid-cols-[1fr_5rem_5rem_auto] items-end gap-2"
                    >
                      <input type="hidden" name="cloId" value={clo.id} />
                      <label className="text-xs">
                        New task
                        <input
                          name="name"
                          required
                          placeholder="Quiz 1"
                          className={cellInput}
                        />
                      </label>
                      <label className="text-xs">
                        Weight (%)
                        <input
                          name="weight"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={0}
                          className={cellInput}
                        />
                      </label>
                      <label className="text-xs">
                        Max score
                        <input
                          name="maxScore"
                          type="number"
                          min={1}
                          defaultValue={100}
                          className={cellInput}
                        />
                      </label>
                      <button
                        type="submit"
                        className="rounded-md border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                      >
                        Add task
                      </button>
                    </form>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </details>
    </div>
  );
}
