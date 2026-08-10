import Link from 'next/link';
import { apiFetch, type AcademicTerm } from '@/lib/api';
import { createAcademicTerm, deleteAcademicTerm } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminAcademicTermsPage() {
  const terms = await apiFetch<AcademicTerm[]>('/academic-terms');
  const sorted = [...terms].sort(
    (a, b) => b.schoolYearStart - a.schoolYearStart || a.semester.localeCompare(b.semester),
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          &larr; Admin
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Academic Terms</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Institution-wide calendar terms. Faculty uploading a CLO
          attainment sheet pick an academic year and semester from what&apos;s
          set up here.
        </p>
      </div>

      <section>
        {sorted.length === 0 ? (
          <p className="text-sm text-neutral-500">No academic terms yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {sorted.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-medium">
                    {t.schoolYearStart}-{t.schoolYearEnd} {t.semester}
                  </span>
                  <span className="ml-2 text-neutral-600 dark:text-neutral-400">{t.label}</span>
                </div>
                <form action={deleteAcademicTerm.bind(null, t.id)}>
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
          action={createAcademicTerm}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <label className="text-sm">
            School year start
            <input
              name="schoolYearStart"
              type="number"
              required
              placeholder="2025"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            School year end
            <input
              name="schoolYearEnd"
              type="number"
              required
              placeholder="2026"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Semester
            <select
              name="semester"
              required
              defaultValue=""
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="" disabled>
                Select&hellip;
              </option>
              <option value="FIRST">First</option>
              <option value="SECOND">Second</option>
              <option value="SUMMER">Summer</option>
            </select>
          </label>
          <label className="text-sm">
            Label
            <input
              name="label"
              required
              maxLength={50}
              placeholder="AY2025-2026 1st Sem"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add Term
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
