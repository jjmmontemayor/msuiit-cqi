import type {
  AssessmentTask,
  CourseOffering,
  LearningPlanEntry,
  OfferingBlueprint,
} from "@/lib/api";

const exportLink =
  "rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-base font-medium">{title}</h3>
      {children}
    </section>
  );
}

// Read-only learning plan: the same columns as the editable table, without
// the drag handle, edit and delete controls.
export function ReadOnlyLearningPlan({
  entries,
  tasks,
}: {
  entries: LearningPlanEntry[];
  tasks: AssessmentTask[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No learning plan added for this syllabus yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100 dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2 text-left">Week</th>
            <th className="px-3 py-2 text-left">Topics</th>
            <th className="px-3 py-2 text-left">Lesson Outcome</th>
            <th className="px-3 py-2 text-left">CLO</th>
            <th className="px-3 py-2 text-left">Methodology</th>
            <th className="px-3 py-2 text-left">Resources</th>
            <th className="px-3 py-2 text-left">Assessment</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const names = tasks
              .filter((t) => t.learningPlanEntryId === entry.id)
              .map((t) => t.name);
            return (
              <tr
                key={entry.id}
                className="border-t border-neutral-200 align-top dark:border-neutral-800"
              >
                <td className="whitespace-nowrap px-3 py-2 font-medium">
                  {entry.weekLabel}
                </td>
                <td className="px-3 py-2">{entry.topics}</td>
                <td className="whitespace-pre-line px-3 py-2 text-neutral-600 dark:text-neutral-400">
                  {entry.lessonOutcome}
                </td>
                <td className="px-3 py-2">{entry.coLabels}</td>
                <td className="whitespace-pre-line px-3 py-2 text-neutral-600 dark:text-neutral-400">
                  {entry.methodology}
                </td>
                <td className="whitespace-pre-line px-3 py-2 text-neutral-600 dark:text-neutral-400">
                  {entry.learningResources}
                </td>
                <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                  {names.length > 0 ? names.join(", ") : entry.assessment}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Read-only summary of everything else in a syllabus.
export function SyllabusSummary({
  programId,
  courseId,
  offering,
  blueprint,
}: {
  programId: string;
  courseId: string;
  offering: CourseOffering;
  blueprint: OfferingBlueprint;
}) {
  const base = `/admin/programs/${programId}/courses/${courseId}/learning-plan/export?offeringId=${offering.id}`;
  const references = (offering.references ?? "")
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);
  const included = blueprint.tasks.filter((t) => t.included);

  return (
    <div className="space-y-6">
      <Block title="Syllabus details">
        <dl className="grid grid-cols-2 gap-4 rounded-md border border-neutral-200 bg-white p-4 text-sm sm:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div>
            <dt className="text-neutral-500">A.Y. and semester</dt>
            <dd className="mt-0.5">
              {offering.syllabusTerm || offering.academicTerm.label}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Modality</dt>
            <dd className="mt-0.5">{offering.modality || "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Population</dt>
            <dd className="mt-0.5">{offering.population ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Coursework weight</dt>
            <dd className="mt-0.5">{offering.courseworkWeight}%</dd>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-neutral-500">Classroom policies</dt>
            <dd className="mt-0.5 whitespace-pre-line">
              {offering.classroomPolicies || "Refer to the Student's Handbook"}
            </dd>
          </div>
        </dl>
      </Block>

      <Block title="Textbooks / references">
        {references.length === 0 ? (
          <p className="text-sm text-neutral-500">None listed.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white text-sm dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
            {references.map((r, i) => (
              <li key={i} className="px-3 py-2">
                {r}
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Assessment blueprint">
        {blueprint.clos.length === 0 ? (
          <p className="text-sm text-neutral-500">No CLOs defined yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white text-sm dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
            {blueprint.clos.map(({ clo, setting }) => {
              const tasks = included.filter((t) => t.cloId === clo.id);
              return (
                <li key={clo.id} className="px-3 py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      <span className="font-medium">{clo.code}</span>
                      <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                        {clo.description}
                      </span>
                    </span>
                    <span className="text-neutral-500">
                      Weight: {setting?.weight ?? 0}%
                    </span>
                  </div>
                  {tasks.length > 0 && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {tasks.map((t) => `${t.name} (${t.weight}%)`).join(", ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Block>

      <Block title="Grading scale">
        <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-1.5 text-left">Minimum rate (%)</th>
                <th className="px-3 py-1.5 text-left">Up to</th>
                <th className="px-3 py-1.5 text-left">Grade</th>
              </tr>
            </thead>
            <tbody>
              {[...blueprint.gradeScale]
                .sort((a, b) => b.min - a.min)
                .map((band, i) => (
                  <tr
                    key={i}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="px-3 py-1.5">{band.min}</td>
                    <td className="px-3 py-1.5">{band.max}</td>
                    <td className="px-3 py-1.5">{band.grade}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Block>

      <Block title="Signatories">
        <dl className="grid grid-cols-1 gap-4 rounded-md border border-neutral-200 bg-white p-4 text-sm sm:grid-cols-3 dark:border-neutral-800 dark:bg-neutral-950">
          <div>
            <dt className="text-neutral-500">Prepared by</dt>
            <dd className="mt-0.5">
              {offering.preparedBy || offering.instructorName || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Reviewed by</dt>
            <dd className="mt-0.5">{offering.reviewedBy || "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Approved by</dt>
            <dd className="mt-0.5">{offering.approvedBy || "—"}</dd>
          </div>
        </dl>
      </Block>

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
      </div>
    </div>
  );
}
