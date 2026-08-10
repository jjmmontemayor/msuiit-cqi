import Link from 'next/link';
import { apiFetch, type Program } from '@/lib/api';
import { createProgram } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const programs = await apiFetch<Program[]>('/programs');

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Set up programs, program learning outcomes, courses, and course learning
          outcomes.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Programs</h2>
          <Link
            href="/admin/academic-terms"
            className="text-sm text-neutral-500 hover:underline"
          >
            Manage Academic Terms &rarr;
          </Link>
        </div>
        {programs.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No programs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {programs.map((program) => (
              <li key={program.id}>
                <Link
                  href={`/admin/programs/${program.id}`}
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

      <section className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-lg font-medium">New Program</h2>
        <form action={createProgram} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              placeholder="BSCS"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Name
            <input
              name="name"
              required
              maxLength={255}
              placeholder="BS Computer Science"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Description
            <textarea
              name="description"
              rows={2}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Create Program
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
