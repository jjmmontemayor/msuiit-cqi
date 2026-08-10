import Link from 'next/link';
import {
  apiFetch,
  type AttainmentBenchmark,
  type Cohort,
  type Plo,
  type PloAttainmentByStudentRow,
  type Student,
} from '@/lib/api';
import { belowBenchmarkClass, buildBatchColorMap } from '@/lib/attainment-display';

export const dynamic = 'force-dynamic';

const studentCols = 'sticky left-0 z-10 w-48';

export default async function PloAttainmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cohortId?: string }>;
}) {
  const { id } = await params;
  const { cohortId: cohortIdParam } = await searchParams;
  const selectedCohortId = cohortIdParam ?? '';
  const cohortQuery = selectedCohortId ? `&cohortId=${selectedCohortId}` : '';

  const [cohorts, plos, students, allPloRows, benchmark] = await Promise.all([
    apiFetch<Cohort[]>(`/cohorts?programId=${id}`),
    apiFetch<Plo[]>(`/plos?programId=${id}`),
    apiFetch<Student[]>(`/students?programId=${id}${cohortQuery}`),
    apiFetch<PloAttainmentByStudentRow[]>('/reports/plo-attainment-by-student'),
    apiFetch<AttainmentBenchmark>(`/attainment-benchmark?programId=${id}`),
  ]);

  const studentIds = new Set(students.map((s) => s.id));
  const ploRows = allPloRows.filter((row) => studentIds.has(row.student_id));

  const scoreByKey = new Map<string, string>();
  for (const row of ploRows) {
    scoreByKey.set(`${row.student_id}::${row.plo_id}`, row.weighted_attainment);
  }

  const batchColors = buildBatchColorMap(cohorts);
  const defaultRowBg = 'bg-white dark:bg-neutral-950';

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Weighted rollup of each student&apos;s CLO scores into every PLO.
          Blank cells have no recorded attainment yet. Values below the{' '}
          {benchmark.percentage}% benchmark are highlighted. Click a student
          to see their full attainment record.
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
      ) : plos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No PLOs set up for this program yet.
        </p>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-48" />
              {plos.map((plo) => (
                <col key={plo.id} className="w-20" />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-20 bg-neutral-100 dark:bg-neutral-900">
              <tr>
                <th className={`${studentCols} z-30 bg-neutral-100 px-3 py-2 text-left dark:bg-neutral-900`}>
                  Student
                </th>
                {plos.map((plo, ploIdx) => (
                  <th
                    key={plo.id}
                    title={plo.description}
                    className={`w-20 px-2 py-2 text-center ${
                      ploIdx === 0 ? 'border-l border-neutral-200 dark:border-neutral-800' : ''
                    }`}
                  >
                    {plo.code}
                  </th>
                ))}
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
                        href={`/programs/${id}/students/${student.id}`}
                        className="hover:underline"
                      >
                        <div className="font-medium">{student.studentNumber}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {student.lastName}, {student.firstName}
                        </div>
                      </Link>
                    </td>
                    {plos.map((plo, ploIdx) => {
                      const raw = scoreByKey.get(`${student.id}::${plo.id}`);
                      const score = raw != null ? Number(raw) : null;
                      return (
                        <td
                          key={plo.id}
                          className={`px-2 py-1.5 text-center tabular-nums ${
                            ploIdx === 0
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
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-md border border-neutral-200 p-4 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
        <p className="font-medium text-neutral-700 dark:text-neutral-300">Nota Bene:</p>
        <p className="mt-1">
          1. Performance Criteria is set to: Benchmark: {benchmark.percentage}%, Target:{' '}
          {benchmark.percentage}%.
        </p>
        <p className="mt-1">
          2. CQI Alert Signs:{' '}
          <span className="text-emerald-600 dark:text-emerald-400">✅ - Target Met</span>,{' '}
          <span className="text-red-600 dark:text-red-400">❌ - Action Required</span>.
        </p>
        <p className="mt-1">
          3. GS - A student who achieved the benchmark or greater is considered Good
          Standing (GS).
        </p>
      </div>
    </div>
  );
}
