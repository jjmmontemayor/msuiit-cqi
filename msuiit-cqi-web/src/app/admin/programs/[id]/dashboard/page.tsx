import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Plo, type Program } from '@/lib/api';

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

export default async function ProgramDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram(id);
  const plos = await apiFetch<Plo[]>(`/plos?programId=${program.id}`);
  const totalPis = plos.reduce((sum, p) => sum + (p.performanceIndicators?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {program.code} — {program.name}
        </h1>
        {program.description && (
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">{program.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-2xl font-semibold">{plos.length}</div>
          <div className="text-sm text-neutral-500">Program Learning Outcomes</div>
        </div>
        <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-2xl font-semibold">{totalPis}</div>
          <div className="text-sm text-neutral-500">Performance Indicators</div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            Program Learning Outcomes &amp; Performance Indicators
          </h2>
          <Link
            href={`/admin/programs/${program.id}`}
            className="text-sm text-neutral-500 hover:underline"
          >
            Edit in Program Settings &rarr;
          </Link>
        </div>
        {plos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No PLOs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {plos.map((plo) => {
              const pis = plo.performanceIndicators ?? [];
              return (
                <li key={plo.id} className="px-4 py-3">
                  <div className="text-sm">
                    <span className="font-medium">{plo.code}</span>
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {plo.description}
                    </span>
                  </div>
                  {pis.length > 0 && (
                    <ul className="mt-2 ml-4 space-y-1 border-l border-neutral-200 pl-3 dark:border-neutral-800">
                      {pis.map((pi) => (
                        <li key={pi.id} className="text-xs text-neutral-600 dark:text-neutral-400">
                          <span className="font-medium">{pi.code}</span> {pi.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
