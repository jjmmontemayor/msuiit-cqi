import Link from 'next/link';
import { apiFetch, type Cohort, type Plo, type PloAttainmentByCourseRow } from '@/lib/api';

export const dynamic = 'force-dynamic';

function formatPct(value: string | number | null) {
  if (value == null) return '—';
  return `${Number(value).toFixed(2)}%`;
}

export default async function PloAttainmentByCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cohortId?: string }>;
}) {
  const { id } = await params;
  const { cohortId: cohortIdParam } = await searchParams;

  const [cohorts, plos] = await Promise.all([
    apiFetch<Cohort[]>(`/cohorts?programId=${id}`),
    apiFetch<Plo[]>(`/plos?programId=${id}`),
  ]);

  if (cohorts.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No batches set up for this program yet — attainment is reported per
        batch, so{' '}
        <Link href={`/admin/programs/${id}`} className="underline">
          add one in Admin
        </Link>
        .
      </p>
    );
  }

  const selectedCohortId = cohortIdParam || cohorts[0].id;

  const byCourseAll = await apiFetch<PloAttainmentByCourseRow[]>(
    `/reports/plo-attainment-by-course?cohortId=${selectedCohortId}`,
  );

  const programPloIds = new Set(plos.map((plo) => plo.id));
  const byCourse = byCourseAll.filter((row) => programPloIds.has(row.plo_id));

  const coursesByCourse = new Map<string, PloAttainmentByCourseRow[]>();
  for (const row of byCourse) {
    const list = coursesByCourse.get(row.course_code) ?? [];
    list.push(row);
    coursesByCourse.set(row.course_code, list);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Weighted rollup of each course&apos;s CLO attainments into every PLO it
          maps to, using that batch&apos;s CLO-PLO mapping.
        </p>
        <form method="get" className="flex items-end gap-2">
          <label className="text-sm">
            Batch
            <select
              name="cohortId"
              defaultValue={selectedCohortId}
              className="mt-1 block w-48 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
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

      {coursesByCourse.size === 0 ? (
        <p className="text-sm text-neutral-500">No attainment data yet for this batch.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-2 text-left">Course</th>
                <th className="px-3 py-2 text-left">PLO</th>
                <th className="px-3 py-2 text-right">Weighted Attainment</th>
              </tr>
            </thead>
            <tbody>
              {[...coursesByCourse.entries()].map(([courseCode, rows]) =>
                rows.map((row, i) => (
                  <tr
                    key={`${row.course_id}-${row.plo_id}`}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="px-3 py-1.5">{i === 0 ? courseCode : ''}</td>
                    <td className="px-3 py-1.5">{row.plo_code}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatPct(row.weighted_attainment)}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
