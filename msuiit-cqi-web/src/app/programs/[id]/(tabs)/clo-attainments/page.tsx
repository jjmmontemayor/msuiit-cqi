import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  apiFetch,
  ApiError,
  type AttainmentBenchmark,
  type Clo,
  type Cohort,
  type CloAttainmentByCourseRow,
  type CloAttainmentMatrixRow,
  type Course,
  type Program,
  type Student,
} from '@/lib/api';
import { belowBenchmarkClass, buildBatchColorMap } from '@/lib/attainment-display';
import { CloAttainmentSummaryTable } from './clo-attainment-summary-table';

export const dynamic = 'force-dynamic';

type CourseWithClos = Course & { clos: Clo[] };

const studentCols = 'sticky left-0 z-10 w-48';

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

export default async function CloAttainmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cohortId?: string }>;
}) {
  const { id } = await params;
  const { cohortId: cohortIdParam } = await searchParams;
  const program = await getProgram(id);
  const selectedCohortId = cohortIdParam ?? '';
  const cohortQuery = selectedCohortId ? `&cohortId=${selectedCohortId}` : '';

  const [cohorts, courses, students, matrixRows, byCourseRows, benchmark] =
    await Promise.all([
      apiFetch<Cohort[]>(`/cohorts?programId=${program.id}`),
      apiFetch<CourseWithClos[]>(`/courses?programId=${program.id}${cohortQuery}`),
      apiFetch<Student[]>(`/students?programId=${program.id}${cohortQuery}`),
      apiFetch<CloAttainmentMatrixRow[]>(
        `/reports/clo-attainment-matrix?programId=${program.id}${cohortQuery}`,
      ),
      apiFetch<CloAttainmentByCourseRow[]>('/reports/clo-attainment-by-course'),
      apiFetch<AttainmentBenchmark>(`/attainment-benchmark?programId=${program.id}`),
    ]);

  const coursesWithClos = courses.filter((c) => c.clos.length > 0);
  const courseIds = new Set(coursesWithClos.map((c) => c.id));
  const summaryRows = byCourseRows.filter((row) => courseIds.has(row.course_id));

  const scoreByKey = new Map<string, string>();
  for (const row of matrixRows) {
    scoreByKey.set(`${row.student_id}::${row.course_id}::${row.clo_code}`, row.score);
  }

  const batchColors = buildBatchColorMap(cohorts);
  const defaultRowBg = 'bg-white dark:bg-neutral-950';

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Recorded CLO scores for every student, grouped by course. Blank
          cells have no recorded attainment yet. Scores below the {benchmark.percentage}%
          benchmark are highlighted. Click a student to see their full
          attainment record.
        </p>
        <form method="get" className="flex items-end gap-2">
          <label className="text-sm">
            Batch
            <select
              name="cohortId"
              defaultValue={selectedCohortId}
              className="mt-1 block w-48 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">All batches</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
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
      </div>

      {!selectedCohortId && cohorts.length > 1 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span>Batch colors:</span>
          {cohorts.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-full ${batchColors.get(c.id)?.swatch}`} />
              {c.code}
            </span>
          ))}
        </div>
      )}

      {students.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No students in this program yet.
        </p>
      ) : coursesWithClos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No courses with CLOs set up for this batch yet.
        </p>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-48" />
              {coursesWithClos.map((course) =>
                course.clos.map((clo) => <col key={clo.id} className="w-16" />),
              )}
            </colgroup>
            <thead className="sticky top-0 z-20 bg-neutral-100 dark:bg-neutral-900">
              <tr>
                <th
                  rowSpan={2}
                  className={`${studentCols} z-30 bg-neutral-100 px-3 py-2 text-left align-bottom dark:bg-neutral-900`}
                >
                  Student
                </th>
                {coursesWithClos.map((course) => (
                  <th
                    key={course.id}
                    colSpan={course.clos.length}
                    className="border-l border-neutral-200 px-3 py-2 text-center dark:border-neutral-800"
                  >
                    <Link
                      href={`/programs/${program.code}/courses/${course.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {course.code}
                    </Link>
                  </th>
                ))}
              </tr>
              <tr>
                {coursesWithClos.map((course) =>
                  course.clos.map((clo, cloIdx) => (
                    <th
                      key={clo.id}
                      title={clo.description}
                      className={`w-16 px-2 py-1.5 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 ${
                        cloIdx === 0
                          ? 'border-l border-neutral-200 dark:border-neutral-800'
                          : ''
                      }`}
                    >
                      {clo.code}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const rowBg =
                  (student.cohortId && batchColors.get(student.cohortId)?.row) ?? defaultRowBg;
                return (
                  <tr
                    key={student.id}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className={`${studentCols} ${rowBg} px-3 py-1.5`}>
                      <Link
                        href={`/programs/${program.code}/students/${student.id}`}
                        className="hover:underline"
                      >
                        <div className="font-medium">{student.studentNumber}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {student.lastName}, {student.firstName}
                        </div>
                      </Link>
                    </td>
                    {coursesWithClos.map((course) =>
                      course.clos.map((clo, cloIdx) => {
                        const rawScore = scoreByKey.get(
                          `${student.id}::${course.id}::${clo.code}`,
                        );
                        const score = rawScore != null ? Number(rawScore) : null;
                        return (
                          <td
                            key={clo.id}
                            className={`px-2 py-1.5 text-center tabular-nums ${
                              cloIdx === 0
                                ? 'border-l border-neutral-200 dark:border-neutral-800'
                                : ''
                            } ${score != null ? belowBenchmarkClass(score, benchmark.percentage) : ''}`}
                          >
                            {score != null ? (
                              score.toFixed(1)
                            ) : (
                              <span className="text-neutral-300 dark:text-neutral-700">—</span>
                            )}
                          </td>
                        );
                      }),
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {summaryRows.length > 0 && (
        <div>
          <h2 className="text-lg font-medium">CLO Attainment Summary</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Average score per course learning outcome, against the {benchmark.percentage}%
            benchmark.
          </p>
          <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <CloAttainmentSummaryTable
              rows={summaryRows}
              benchmarkPercentage={benchmark.percentage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
