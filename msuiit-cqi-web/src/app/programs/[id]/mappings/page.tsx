import Link from 'next/link';
import { apiFetch, type Clo, type Cohort, type CloPloMapping, type Course, type Plo } from '@/lib/api';
import { buildPloSummary } from '@/lib/mapping-summary';
import { MappingSummaryTable } from '@/components/mapping-summary-table';
import { LEVEL_BADGE_CLASSES } from '@/lib/mapping-level-colors';

export const dynamic = 'force-dynamic';

type CourseWithClos = Course & { clos: Clo[] };

export default async function MappingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cohortId?: string }>;
}) {
  const { id } = await params;
  const { cohortId: cohortIdParam } = await searchParams;

  const [cohorts, plos, courses] = await Promise.all([
    apiFetch<Cohort[]>(`/cohorts?programId=${id}`),
    apiFetch<Plo[]>(`/plos?programId=${id}`),
    apiFetch<CourseWithClos[]>(`/courses?programId=${id}`),
  ]);

  const selectedCohortId = cohortIdParam || cohorts[0]?.id;
  const mappings = selectedCohortId
    ? await apiFetch<CloPloMapping[]>(`/mappings?cohortId=${selectedCohortId}`)
    : [];

  const levelByCloAndPlo = new Map<string, CloPloMapping>();
  for (const m of mappings) {
    levelByCloAndPlo.set(`${m.cloId}::${m.ploId}`, m);
  }

  const summaryRows = buildPloSummary(plos, courses, mappings);

  if (cohorts.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No batches set up for this program yet — CLO-PLO mapping is scoped per
        batch, so{' '}
        <Link href={`/admin/programs/${id}`} className="underline">
          add one in Admin
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Mapping level per course learning outcome:{' '}
          <span className="font-medium text-blue-600 dark:text-blue-400">I = Introduced</span>,{' '}
          <span className="font-medium text-amber-600 dark:text-amber-400">P = Practiced</span>,{' '}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">D = Demonstrated</span>.
          Each batch has its own mapping.
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

      {courses.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No courses set up for this program yet —{' '}
          <Link href={`/admin/programs/${id}`} className="underline">
            add some in Admin
          </Link>
          .
        </p>
      ) : (
        <div className="flex-1 overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-neutral-100 dark:bg-neutral-900">
              <tr>
                <th className="sticky left-0 z-30 bg-neutral-100 px-3 py-2 text-left dark:bg-neutral-900">
                  Course
                </th>
                <th className="sticky left-[9rem] z-30 bg-neutral-100 px-3 py-2 text-left dark:bg-neutral-900">
                  CLO
                </th>
                {plos.map((plo) => (
                  <th key={plo.id} className="px-3 py-2 text-center" title={plo.description}>
                    {plo.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((course) =>
                course.clos.map((clo, cloIdx) => (
                  <tr
                    key={clo.id}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    {cloIdx === 0 && (
                      <td
                        rowSpan={course.clos.length}
                        className="sticky left-0 z-10 w-36 whitespace-nowrap bg-white px-3 py-1.5 align-top font-medium dark:bg-neutral-950"
                      >
                        <Link
                          href={`/programs/${id}/courses/${course.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {course.code}
                        </Link>
                      </td>
                    )}
                    <td className="sticky left-[9rem] z-10 w-64 bg-white px-3 py-1.5 align-top dark:bg-neutral-950">
                      <div className="font-medium text-neutral-800 dark:text-neutral-200">
                        {clo.code}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {clo.description}
                      </div>
                    </td>
                    {plos.map((plo) => {
                      const mapping = levelByCloAndPlo.get(`${clo.id}::${plo.id}`);
                      return (
                        <td key={plo.id} className="px-3 py-1.5 text-center">
                          {mapping ? (
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${LEVEL_BADGE_CLASSES[mapping.levelCode]}`}
                              title={mapping.assessmentMethod ?? undefined}
                            >
                              {mapping.levelCode}
                            </span>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}

      {plos.length > 0 && (
        <div>
          <h2 className="text-lg font-medium">Summary — I/P/D count per PLO</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Click a column header to sort, or a row to see which courses contribute
            to its counts.
          </p>
          <div className="mt-3">
            <MappingSummaryTable rows={summaryRows} />
          </div>
        </div>
      )}
    </div>
  );
}
