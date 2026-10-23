import { notFound } from 'next/navigation';
import {
  apiFetch,
  ApiError,
  type Plo,
  type Program,
} from '@/lib/api';
import {
  createPlo,
} from '../../../../actions';
import { PloRow } from './plo-row';

export const dynamic = 'force-dynamic';

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

export default async function ProgramLearningOutcomesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram(id);

  const plos = await apiFetch<Plo[]>(`/plos?programId=${program.id}`);

  const boundCreatePlo = createPlo.bind(null, program.id);

  return (
    <>
      <section>
        <h2 className="text-lg font-medium">Program Learning Outcomes</h2>
        {plos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No PLOs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {plos.map((plo) => (
              <PloRow key={plo.id} programId={program.id} plo={plo} />
            ))}
          </ul>
        )}

        <form
          action={boundCreatePlo}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              placeholder="PLO1"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Description
            <input
              name="description"
              required
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Display order
            <input
              name="displayOrder"
              type="number"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm sm:col-span-4">
            Performance Indicators (optional — one per line, numbered PI1, PI2, &hellip; in order)
            <textarea
              name="performanceIndicators"
              rows={3}
              placeholder={'Identify key components and algorithms necessary for a solution\nProduce a solution with specifications'}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add PLO
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
