import { apiFetch, type Plo, type PloAttainmentByStudentRow } from '@/lib/api';

export const dynamic = 'force-dynamic';

function formatPct(value: string | number | null) {
  if (value == null) return '—';
  return `${Number(value).toFixed(2)}%`;
}

export default async function PloAttainmentByStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [plos, byStudentAll] = await Promise.all([
    apiFetch<Plo[]>(`/plos?programId=${id}`),
    apiFetch<PloAttainmentByStudentRow[]>('/reports/plo-attainment-by-student'),
  ]);

  const programPloIds = new Set(plos.map((plo) => plo.id));
  const byStudent = byStudentAll.filter((row) => programPloIds.has(row.plo_id));

  const studentsByStudent = new Map<string, PloAttainmentByStudentRow[]>();
  for (const row of byStudent) {
    const list = studentsByStudent.get(row.student_number) ?? [];
    list.push(row);
    studentsByStudent.set(row.student_number, list);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Weighted rollup of each student&apos;s CLO scores (across all their
        enrollments) into every PLO.
      </p>

      {studentsByStudent.size === 0 ? (
        <p className="text-sm text-neutral-500">No attainment data yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-2 text-left">Student No.</th>
                <th className="px-3 py-2 text-left">PLO</th>
                <th className="px-3 py-2 text-right">Weighted Attainment</th>
              </tr>
            </thead>
            <tbody>
              {[...studentsByStudent.entries()].map(([studentNumber, rows]) =>
                rows.map((row, i) => (
                  <tr
                    key={`${row.student_id}-${row.plo_id}`}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="px-3 py-1.5">{i === 0 ? studentNumber : ''}</td>
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
