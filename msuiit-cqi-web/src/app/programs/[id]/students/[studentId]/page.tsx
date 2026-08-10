import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  apiFetch,
  ApiError,
  type CloAttainmentByStudentRow,
  type Cohort,
  type CohortAdviser,
  type Plo,
  type PloAttainmentByStudentRow,
  type Program,
  type Student,
} from '@/lib/api';

export const dynamic = 'force-dynamic';

function formatPct(value: string | number | null) {
  if (value == null) return '—';
  return `${Number(value).toFixed(2)}%`;
}

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

async function getStudent(id: string): Promise<Student> {
  try {
    return await apiFetch<Student>(`/students/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
}

export default async function StudentAttainmentPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id, studentId } = await params;

  const [program, student, plos, cohorts, cohortAdvisers, allPloRows, cloRows] =
    await Promise.all([
      getProgram(id),
      getStudent(studentId),
      apiFetch<Plo[]>(`/plos?programId=${id}`),
      apiFetch<Cohort[]>(`/cohorts?programId=${id}`),
      apiFetch<CohortAdviser[]>('/cohort-advisers'),
      apiFetch<PloAttainmentByStudentRow[]>('/reports/plo-attainment-by-student'),
      apiFetch<CloAttainmentByStudentRow[]>(
        `/reports/clo-attainment-by-student?studentId=${studentId}`,
      ),
    ]);

  const cohort = cohorts.find((c) => c.id === student.cohortId);
  const advisers = cohortAdvisers.filter((ca) => ca.cohortId === student.cohortId);

  const programPloIds = new Set(plos.map((plo) => plo.id));
  const ploRows = allPloRows.filter(
    (row) => row.student_id === studentId && programPloIds.has(row.plo_id),
  );

  const byCourse = new Map<string, CloAttainmentByStudentRow[]>();
  for (const row of cloRows) {
    const list = byCourse.get(row.course_code) ?? [];
    list.push(row);
    byCourse.set(row.course_code, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/programs/${program.id}/clo-attainments`}
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; CLO Attainments
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          {student.studentNumber} — {student.lastName}, {student.firstName}
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {cohort ? `Batch ${cohort.code}` : 'No batch'}
          {' · '}
          {advisers.length > 0
            ? `Adviser${advisers.length > 1 ? 's' : ''}: ${advisers.map((a) => a.faculty.name).join(', ')}`
            : 'No adviser assigned'}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-medium">PLO Attainment</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Weighted rollup of this student&apos;s CLO scores (across all their
          enrollments) into every PLO.
        </p>
        {ploRows.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No PLO attainment data yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-900">
                <tr>
                  <th className="px-3 py-2 text-left">PLO</th>
                  <th className="px-3 py-2 text-right">Weighted Attainment</th>
                </tr>
              </thead>
              <tbody>
                {ploRows.map((row) => (
                  <tr
                    key={row.plo_id}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    <td className="px-3 py-1.5">{row.plo_code}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatPct(row.weighted_attainment)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium">CLO Attainment</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Raw CLO scores per course, as recorded in CLO_Attainments.
        </p>
        {byCourse.size === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No CLO attainment data yet.</p>
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
                            href={`/programs/${program.id}/courses/${row.course_id}`}
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
      </section>
    </div>
  );
}
