import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Clo, type Cohort, type CloPloMapping, type Course, type Plo, type Program } from '@/lib/api';
import { MappingCell } from './mapping-cell';
import { copyMappingsFromCohort } from './actions';
import { buildPloSummary } from '@/lib/mapping-summary';
import { MappingSummaryTable } from '@/components/mapping-summary-table';

export const dynamic = 'force-dynamic';

type CourseWithClos = Course & { clos: Clo[] };

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

export default async function AdminMappingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cohortId?: string }>;
}) {
  const { id } = await params;
  const { cohortId: cohortIdParam } = await searchParams;
  const program = await getProgram(id);

  const [cohorts, plos] = await Promise.all([
    apiFetch<Cohort[]>(`/cohorts?programId=${program.id}`),
    apiFetch<Plo[]>(`/plos?programId=${program.id}`),
  ]);

  if (cohorts.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href={`/admin/programs/${program.id}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; {program.code}
        </Link>
        <p className="text-sm text-neutral-500">
          No batches set up yet — add one above before mapping CLOs to PLOs.
        </p>
      </div>
    );
  }

  const selectedCohortId = cohortIdParam || cohorts[0].id;
  const [courses, mappings] = await Promise.all([
    apiFetch<CourseWithClos[]>(
      `/courses?programId=${program.id}&cohortId=${selectedCohortId}`,
    ),
    apiFetch<CloPloMapping[]>(`/mappings?cohortId=${selectedCohortId}`),
  ]);

  const levelByCloAndPlo = new Map<string, CloPloMapping>();
  for (const m of mappings) {
    levelByCloAndPlo.set(`${m.cloId}::${m.ploId}`, m);
  }

  const summaryRows = buildPloSummary(plos, courses, mappings);

  const otherCohorts = cohorts.filter((c) => c.id !== selectedCohortId);
  const boundCopyMappings = copyMappingsFromCohort.bind(
    null,
    program.id,
    selectedCohortId,
  );

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div>
        <Link
          href={`/admin/programs/${program.id}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; {program.code}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          CLO-PLO Mapping — {program.code}
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Click a cell to set the mapping level:{' '}
          <span className="font-medium text-blue-600 dark:text-blue-400">I = Introduced</span>,{' '}
          <span className="font-medium text-amber-600 dark:text-amber-400">P = Practiced</span>,{' '}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">D = Demonstrated</span>,
          — = not mapped. Each batch has its own mapping — changes save immediately.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
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
            Switch
          </button>
        </form>

        {otherCohorts.length > 0 && (
          <form action={boundCopyMappings} className="flex items-end gap-2">
            <label className="text-sm">
              Copy from
              <select
                name="sourceCohortId"
                defaultValue=""
                className="mt-1 block w-48 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="" disabled>
                  Select a batch&hellip;
                </option>
                {otherCohorts.map((c) => (
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
              Copy missing CLOs &amp; mappings
            </button>
          </form>
        )}
      </div>

      {courses.length === 0 || plos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {courses.length === 0
            ? 'No courses set up for this program yet — add some above.'
            : 'No PLOs set up for this program yet — add some above.'}
        </p>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
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
                          href={`/programs/${program.id}/courses/${course.id}`}
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
                          <MappingCell
                            programId={program.id}
                            cohortId={selectedCohortId}
                            cloId={clo.id}
                            ploId={plo.id}
                            initialLevel={mapping?.levelCode ?? ''}
                          />
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
