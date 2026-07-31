import Link from 'next/link';
import { apiFetch, type Program } from '@/lib/api';

// Fetches live data from the API on every request — not suitable for
// build-time static generation.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let programs: Program[] = [];
  let error: string | null = null;

  try {
    programs = await apiFetch<Program[]>('/programs');
  } catch {
    error = 'Could not reach the API. Is msuiit-cqi-api running on the configured port?';
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Program Assessment &amp; Evaluation</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          CLO-to-PLO attainment tracking, replacing the manually-maintained CQI
          workbook.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-lg font-medium">Programs</h2>
        {programs.length === 0 && !error ? (
          <p className="mt-2 text-sm text-neutral-500">
            No programs yet — run the xlsx import seed script in msuiit-cqi-api.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {programs.map((program) => (
              <li key={program.id} className="px-4 py-3">
                <span className="font-medium">{program.code}</span>
                <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                  {program.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/mappings"
          className="rounded-md border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
        >
          <h3 className="font-medium">CLO-PLO Mapping</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            View how course learning outcomes map to program learning outcomes.
          </p>
        </Link>
        <Link
          href="/reports"
          className="rounded-md border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
        >
          <h3 className="font-medium">Attainment Reports</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            PLO attainment rolled up by course and by student.
          </p>
        </Link>
        <Link
          href="/evaluations"
          className="rounded-md border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
        >
          <h3 className="font-medium">Evaluations</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Performance indicator benchmarks, targets, and narrative results.
          </p>
        </Link>
      </section>
    </div>
  );
}
