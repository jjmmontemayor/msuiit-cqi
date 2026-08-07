import Link from 'next/link';
import { apiFetch, type CloAttainmentByStudentRow, type Student } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function CloAttainmentByStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { id } = await params;
  const { studentId: studentIdParam } = await searchParams;

  const students = await apiFetch<Student[]>(`/students?programId=${id}`);
  const selectedId = studentIdParam || students[0]?.id;
  const selectedStudent = students.find((s) => s.id === selectedId);

  const rows = selectedId
    ? await apiFetch<CloAttainmentByStudentRow[]>(
        `/reports/clo-attainment-by-student?studentId=${selectedId}`,
      )
    : [];

  const byCourse = new Map<string, CloAttainmentByStudentRow[]>();
  for (const row of rows) {
    const list = byCourse.get(row.course_code) ?? [];
    list.push(row);
    byCourse.set(row.course_code, list);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Raw CLO scores per course for one student, as recorded in CLO_Attainments.
      </p>

      {students.length === 0 ? (
        <p className="text-sm text-neutral-500">No students in this program yet.</p>
      ) : (
        <>
          <form method="get" className="flex items-end gap-2">
            <label className="text-sm">
              Student
              <select
                name="studentId"
                defaultValue={selectedId}
                className="mt-1 block w-72 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentNumber} — {s.lastName}, {s.firstName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              View
            </button>
          </form>

          {selectedStudent && (
            <div>
              <h2 className="text-lg font-medium">
                {selectedStudent.studentNumber} — {selectedStudent.lastName},{' '}
                {selectedStudent.firstName}
              </h2>

              {byCourse.size === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">
                  No CLO attainment data for this student yet.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-100 dark:bg-neutral-900">
                      <tr>
                        <th className="px-3 py-2 text-left">Course</th>
                        <th className="px-3 py-2 text-left">CLO</th>
                        <th className="px-3 py-2 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...byCourse.entries()].map(([courseCode, courseRows]) =>
                        courseRows.map((row, i) => (
                          <tr
                            key={row.clo_id}
                            className="border-t border-neutral-200 dark:border-neutral-800"
                          >
                            <td className="px-3 py-1.5">
                              {i === 0 ? (
                                <Link
                                  href={`/programs/${id}/courses/${row.course_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  {courseCode}
                                </Link>
                              ) : (
                                ''
                              )}
                            </td>
                            <td className="px-3 py-1.5">{row.clo_code}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">
                              {Number(row.score).toFixed(2)}
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
