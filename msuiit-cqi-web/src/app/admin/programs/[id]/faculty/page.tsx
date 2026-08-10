import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Faculty, type Program } from '@/lib/api';
import { createFaculty, deleteFaculty } from './actions';

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

export default async function AdminFacultyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram(id);
  const faculty = await apiFetch<Faculty[]>(`/faculty?programId=${program.id}`);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/programs/${program.id}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; {program.code}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Faculty — {program.code}</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Assign faculty as advisers to a batch from the program page.
        </p>
      </div>

      <section>
        {faculty.length === 0 ? (
          <p className="text-sm text-neutral-500">No faculty yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {faculty.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-medium">{f.name}</span>
                  {f.email && (
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {f.email}
                    </span>
                  )}
                  {!f.isActive && (
                    <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      Inactive
                    </span>
                  )}
                </div>
                <form action={deleteFaculty.bind(null, program.id, f.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form
          action={createFaculty.bind(null, program.id)}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-2 dark:border-neutral-800"
        >
          <label className="text-sm">
            Name
            <input
              name="name"
              required
              maxLength={255}
              placeholder="Dr. Juan Dela Cruz"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Email
            <input
              name="email"
              type="email"
              maxLength={255}
              placeholder="jdelacruz@g.msuiit.edu.ph"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add Faculty
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
