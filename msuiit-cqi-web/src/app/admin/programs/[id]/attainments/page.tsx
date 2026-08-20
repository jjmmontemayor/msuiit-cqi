import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Program } from '@/lib/api';

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

export default async function ProgramAttainmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram(id);

  const links = [
    {
      href: `/programs/${program.code}/clo-attainments`,
      label: 'CLO Attainments',
      description: 'Per-student CLO scores by course, sourced from uploaded attainment sheets.',
    },
    {
      href: `/programs/${program.code}/plo-attainments`,
      label: 'PLO Attainments',
      description: 'Weighted PLO rollup computed from CLO-PLO mapping levels and CLO scores.',
    },
    {
      href: `/programs/${program.code}/evaluations`,
      label: 'Evaluations',
      description: 'Faculty-entered narrative benchmark/target evaluations per Performance Indicator.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attainments — {program.code}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Attainment reporting lives on the program&apos;s public tabs — jump straight
          to one below.
        </p>
      </div>

      <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <span>
                <span className="font-medium">{link.label}</span>
                <span className="mt-0.5 block text-sm text-neutral-500">{link.description}</span>
              </span>
              <span className="shrink-0 text-neutral-400">&rarr;</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
