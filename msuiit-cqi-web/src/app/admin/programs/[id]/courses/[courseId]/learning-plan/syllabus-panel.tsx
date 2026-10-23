import {
  apiFetch,
  type CourseOffering,
  type OfferingBlueprint,
} from "@/lib/api";
import {
  addAssessmentTask,
  deleteAssessmentTask,
  resetGradeScale,
  saveGradeScale,
  saveOfferingClo,
  setOfferingAlignment,
  setAssessmentClo,
  updateAssessmentTask,
  updateOfferingSyllabusDetails,
} from "../../../../../actions";
import { AutoSubmitInput } from "@/components/auto-submit-input";
import { AutoSubmitTextarea } from "@/components/auto-submit-textarea";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
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
  const unassigned = blueprint.tasks.filter((t) => t.included && !t.cloId);
  const excluded = blueprint.tasks.filter((t) => !t.included);
  const taskTotal = (cloId: string) =>
    blueprint.tasks
      .filter((t) => t.included && t.cloId === cloId)
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
          <p className="text-xs text-neutral-500 sm:col-span-4">
            Course information for this syllabus. Leave a field blank to use
            the course record.
          </p>
          <label className="text-sm">
            Course code
            <input
              name="syllabusCode"
              defaultValue={offering.syllabusCode ?? ""}
              placeholder={offering.course?.code ?? ""}
              className={input}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Course title
            <input
              name="syllabusTitle"
              defaultValue={offering.syllabusTitle ?? ""}
              placeholder={offering.course?.title ?? ""}
              className={input}
            />
          </label>
          <label className="text-sm">
            Credits (units)
            <input
              name="syllabusCredits"
              type="number"
              min={0}
              defaultValue={offering.syllabusCredits ?? ""}
              placeholder={String(offering.course?.credits ?? "")}
              className={input}
            />
          </label>
          <label className="text-sm sm:col-span-4">
            Course description
            <textarea
              name="syllabusDescription"
              rows={3}
              defaultValue={offering.syllabusDescription ?? ""}
              placeholder={offering.course?.description ?? ""}
              className={input}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Pre-requisite / co-requisite
            <input
              name="syllabusPrerequisites"
              defaultValue={offering.syllabusPrerequisites ?? ""}
              placeholder={offering.course?.prerequisites ?? "None"}
              className={input}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            A.Y. and semester
            <input
              name="syllabusTerm"
              defaultValue={offering.syllabusTerm ?? ""}
              placeholder={offering.academicTerm.label}
              className={input}
            />
          </label>
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
          <label className="text-sm sm:col-span-4">
            Assessment blueprint note
            <textarea
              name="blueprintNote"
              rows={2}
              defaultValue={offering.blueprintNote ?? ""}
              placeholder="Leave blank for the standard note under the blueprint table"
              className={input}
            />
          </label>
          <label className="text-sm sm:col-span-4">
            Grading system note
            <textarea
              name="gradingNote"
              rows={2}
              defaultValue={offering.gradingNote ?? ""}
              placeholder="Leave blank for the standard note under the grading scheme"
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
                const tasks = blueprint.tasks.filter(
                  (t) => t.included && t.cloId === clo.id,
                );
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
                      </div>
                      <label className="text-xs sm:col-span-6">
                        Learning outcome text in this syllabus
                        <AutoSubmitTextarea
                          name="description"
                          rows={2}
                          defaultValue={setting?.description ?? ""}
                          placeholder={clo.description}
                          className={cellInput}
                        />
                      </label>
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

              {unassigned.length > 0 && (
                <div className="space-y-2 rounded-md border border-amber-300 p-3 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Counted assessments without a CLO. Pick a CLO so they feed
                    its score; until then they appear as uncounted columns in
                    the grading sheet.
                  </p>
                  {unassigned.map((t) => (
                    <form
                      key={t.id}
                      action={setAssessmentClo.bind(null, programId, courseId, t.id)}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="min-w-32">{t.name}</span>
                      <AutoSubmitSelect name="cloId" defaultValue="" className={cellInput}>
                        <option value="">No CLO</option>
                        {blueprint.clos.map(({ clo }) => (
                          <option key={clo.id} value={clo.id}>
                            {clo.code}
                          </option>
                        ))}
                      </AutoSubmitSelect>
                    </form>
                  ))}
                </div>
              )}
              {excluded.length > 0 && (
                <p className="text-xs text-neutral-500">
                  Not counted toward CLO computation:{" "}
                  {excluded.map((t) => t.name).join(", ")}
                </p>
              )}
            </>
          )}
        </div>
      </details>

      <details className="rounded-md border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
          CLO &ndash; PLO alignment
        </summary>
        <div className="space-y-2 overflow-x-auto border-t border-neutral-200 p-3 dark:border-neutral-800">
          {blueprint.clos.length === 0 || blueprint.alignment.plos.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Needs CLOs and program learning outcomes.
            </p>
          ) : (
            <>
              <p className="text-xs text-neutral-500">
                Starts from the program&apos;s mapping. Pick a level to change
                it for this syllabus only, or &ldquo;Default&rdquo; to follow
                the program again.
              </p>
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left">PLO</th>
                    {blueprint.clos.map(({ clo }) => (
                      <th key={clo.id} className="px-2 py-1 text-left">
                        {clo.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blueprint.alignment.plos.map((plo) => (
                    <tr
                      key={plo.id}
                      className="border-t border-neutral-200 dark:border-neutral-800"
                    >
                      <td className="px-2 py-1 font-medium" title={plo.description}>
                        {plo.code}
                      </td>
                      {blueprint.clos.map(({ clo }) => {
                        const key = `${clo.id}::${plo.id}`;
                        const override = blueprint.alignment.overrides.find(
                          (o) => o.cloId === clo.id && o.ploId === plo.id,
                        );
                        return (
                          <td key={clo.id} className="px-2 py-1">
                            <form
                              action={setOfferingAlignment.bind(
                                null,
                                programId,
                                courseId,
                                offering.id,
                              )}
                            >
                              <input type="hidden" name="cloId" value={clo.id} />
                              <input type="hidden" name="ploId" value={plo.id} />
                              <AutoSubmitSelect
                                name="value"
                                defaultValue={override ? override.levelCode : "__default"}
                                className={cellInput}
                              >
                                <option value="__default">
                                  Default ({blueprint.alignment.defaults[key] ?? "none"})
                                </option>
                                <option value="">Blank</option>
                                {blueprint.alignment.levels.map((l) => (
                                  <option key={l.displayCode} value={l.displayCode}>
                                    {l.displayCode} &ndash; {l.label}
                                  </option>
                                ))}
                              </AutoSubmitSelect>
                            </form>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </details>

      <details className="rounded-md border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
          Grading scale{blueprint.customGradeScale ? " (customised)" : ""}
        </summary>
        <div className="space-y-3 border-t border-neutral-200 p-3 dark:border-neutral-800">
          <form
            action={saveGradeScale.bind(null, programId, courseId, offering.id)}
            className="space-y-2"
          >
            <div className="grid grid-cols-[6rem_6rem_6rem] gap-2 text-xs text-neutral-500">
              <span>Minimum rate (%)</span>
              <span>Up to</span>
              <span>Grade</span>
            </div>
            {[...blueprint.gradeScale]
              .sort((a, b) => b.min - a.min)
              .concat([{ min: NaN, max: "", grade: "" }])
              .map((band, i) => (
                <div key={i} className="grid grid-cols-[6rem_6rem_6rem] gap-2">
                  <input
                    name="min"
                    type="number"
                    step="0.01"
                    defaultValue={Number.isNaN(band.min) ? "" : band.min}
                    className={cellInput}
                  />
                  <input name="max" defaultValue={band.max} className={cellInput} />
                  <input name="grade" defaultValue={band.grade} className={cellInput} />
                </div>
              ))}
            <p className="text-xs text-neutral-500">
              Rows with an empty minimum or grade are dropped. The last row is a
              spare for adding a band.
            </p>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Save scale
            </button>
          </form>
          {blueprint.customGradeScale && (
            <form action={resetGradeScale.bind(null, programId, courseId, offering.id)}>
              <button type="submit" className={exportLink}>
                Reset to the default scale
              </button>
            </form>
          )}
        </div>
      </details>
    </div>
  );
}
