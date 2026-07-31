import {
  apiFetch,
  type PloAttainmentByCourseRow,
  type PloAttainmentByStudentRow,
  type Program,
} from '@/lib/api';

export const dynamic = 'force-dynamic';

function formatPct(value: string | number | null) {
  if (value == null) return '—';
  return `${Number(value).toFixed(2)}%`;
}

export default async function ReportsPage() {
  const programs = await apiFetch<Program[]>('/programs');
  const program = programs[0];

  if (!program) {
    return (
      <p className="text-sm text-neutral-500">
        No program found yet — run the xlsx import seed script in msuiit-cqi-api.
      </p>
    );
  }

  const [byCourse, byStudent] = await Promise.all([
    apiFetch<PloAttainmentByCourseRow[]>('/reports/plo-attainment-by-course'),
    apiFetch<PloAttainmentByStudentRow[]>('/reports/plo-attainment-by-student'),
  ]);

  const coursesByCourse = new Map<string, PloAttainmentByCourseRow[]>();
  for (const row of byCourse) {
    const list = coursesByCourse.get(row.course_code) ?? [];
    list.push(row);
    coursesByCourse.set(row.course_code, list);
  }

  const studentsByStudent = new Map<string, PloAttainmentByStudentRow[]>();
  for (const row of byStudent) {
    const list = studentsByStudent.get(row.student_number) ?? [];
    list.push(row);
    studentsByStudent.set(row.student_number, list);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Attainment Reports — {program.code}</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Weighted rollups computed from raw CLO scores and CLO-PLO mapping levels
          (see reporting views in the API).
        </p>
      </div>

      <section>
        <h2 className="text-lg font-medium">PLO Attainment by Course</h2>
        <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
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
      </section>

      <section>
        <h2 className="text-lg font-medium">PLO Attainment by Student</h2>
        <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
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
      </section>
    </div>
  );
}
