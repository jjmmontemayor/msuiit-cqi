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
        <h1 className="text-2xl font-semibold">MSU-IIT PACE</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Program Assessment &amp; Continuous Evaluation
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
            No programs yet —{' '}
            <Link href="/admin" className="underline">
              set one up in Admin
            </Link>
            , or run the xlsx import seed script in msuiit-cqi-api.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {programs.map((program) => (
              <li key={program.id}>
                <Link
                  href={`/programs/${program.code}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  <span>
                    <span className="font-medium">{program.code}</span>
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {program.name}
                    </span>
                  </span>
                  <span className="text-neutral-400">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
