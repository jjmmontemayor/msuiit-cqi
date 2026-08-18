import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Program } from '@/lib/api';
import { ProgramTabs } from './program-tabs';

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

export default async function ProgramLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram(id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          {program.code} — {program.name}
        </h1>
        {program.description && (
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {program.description}
          </p>
        )}
      </div>

      <ProgramTabs programCode={program.code} />

      {children}
    </div>
  );
}
