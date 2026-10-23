import Link from "next/link";
import {
  apiFetch,
  type College,
  type CurriculumVersion,
  type Program,
} from "@/lib/api";
import { AutoSubmitInput } from "@/components/auto-submit-input";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { DeleteButton } from "@/components/icon-buttons";
import {
  createCollege,
  createProgram,
  deleteCollege,
  updateProgramPlacement,
} from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900";

// Revision year of a curriculum version: the recorded effective year, else a
// four-digit year found in its code (e.g. "2018-Rev2").
function versionYear(v: CurriculumVersion): number | null {
  if (v.effectiveYear != null) return v.effectiveYear;
  const m = v.code.match(/(?:19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

function tally<T>(items: T[], key: (item: T) => string | number | null) {
  const counts = new Map<string | number, number>();
  for (const item of items) {
    const k = key(item);
    if (k == null) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({
    label: String(label),
    count,
  }));
}

function BarList({
  rows,
  empty,
}: {
  rows: { label: string; count: number }[];
  empty: string;
}) {
  if (rows.length === 0)
    return <p className="text-sm text-neutral-500">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate" title={r.label}>
            {r.label}
          </span>
          <span className="h-3 flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
            <span
              className="block h-3 rounded-full bg-neutral-700 dark:bg-neutral-300"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </span>
          <span className="w-6 shrink-0 text-right tabular-nums">
            {r.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Card({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-base font-medium">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-neutral-500">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function AdminPage() {
  const [programs, colleges, versions] = await Promise.all([
    apiFetch<Program[]>("/programs"),
    apiFetch<College[]>("/colleges"),
    apiFetch<CurriculumVersion[]>("/curriculum-versions"),
  ]);

  const currentYear = new Date().getFullYear();
  const collegeById = new Map(colleges.map((c) => [c.id, c]));

  // Programs per college
  const perCollege = tally(programs, (p) =>
    p.collegeId
      ? (collegeById.get(p.collegeId)?.code ?? "Unassigned")
      : "Unassigned",
  ).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  // Programs per year established
  const perYear = tally(programs, (p) => p.yearEstablished).sort(
    (a, b) => Number(a.label) - Number(b.label),
  );
  const noYearEstablished = programs.filter(
    (p) => p.yearEstablished == null,
  ).length;

  // Curriculum revisions per year
  const revisionsPerYear = tally(versions, versionYear).sort(
    (a, b) => Number(a.label) - Number(b.label),
  );

  // Revision watchlist: last revision + cycle length = next revision year.
  const revisionStatus = programs
    .map((p) => {
      const years = versions
        .filter((v) => v.programId === p.id)
        .map(versionYear)
        .filter((y): y is number => y != null);
      if (years.length === 0) return null;
      const lastRevision = Math.max(...years);
      const nextDue = lastRevision + p.revisionCycleYears;
      const state: "overdue" | "soon" | "ok" =
        nextDue < currentYear
          ? "overdue"
          : nextDue <= currentYear + 1
            ? "soon"
            : "ok";
      return { program: p, lastRevision, nextDue, state };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  const watchlist = revisionStatus
    .filter((r) => r.state !== "ok")
    .sort((a, b) => a.nextDue - b.nextDue);
  const overdueCount = watchlist.filter((r) => r.state === "overdue").length;
  const soonCount = watchlist.length - overdueCount;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">All Programs</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Overview of every program, its college and its curriculum revision
          schedule.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            ["Programs", programs.length],
            ["Colleges", colleges.length],
            ["Revision overdue", overdueCount],
            ["Revising within a year", soonCount],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-sm text-neutral-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Programs per college">
          <BarList rows={perCollege} empty="No programs yet." />
        </Card>
        <Card
          title="Programs per year"
          note={
            noYearEstablished > 0
              ? `By year established. ${noYearEstablished} program${noYearEstablished === 1 ? " has" : "s have"} no year set.`
              : "By year established."
          }
        >
          <BarList
            rows={perYear}
            empty="Set a year established on a program below."
          />
        </Card>
        <Card
          title="Curriculum revisions per year"
          note="By the year each curriculum version took effect."
        >
          <BarList
            rows={revisionsPerYear}
            empty="No curriculum versions yet."
          />
        </Card>
        <Card
          title="Revising soon"
          note="Last revision + the program's revision cycle. Overdue, or due this year or next."
        >
          {watchlist.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No program is due for a revision soon.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
              {watchlist.map(({ program, lastRevision, nextDue, state }) => (
                <li
                  key={program.id}
                  className="flex items-center justify-between gap-3 py-1.5"
                >
                  <Link
                    href={`/admin/programs/${program.id}`}
                    className="font-medium hover:underline"
                  >
                    {program.code}
                  </Link>
                  <span className="text-xs text-neutral-500">
                    last {lastRevision} &middot; due {nextDue}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      state === "overdue"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    {state === "overdue" ? "Overdue" : "Due soon"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-medium">Programs</h2>
        {programs.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No programs yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-100 text-left text-xs text-neutral-500 dark:bg-neutral-900">
                <tr>
                  <th className="px-4 py-2 font-normal">Program</th>
                  <th className="px-3 py-2 font-normal">College</th>
                  <th className="px-3 py-2 font-normal">Year established</th>
                  <th className="px-3 py-2 font-normal">
                    Revision cycle (years)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {programs.map((program) => (
                  <tr key={program.id}>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/programs/${program.id}`}
                        className="hover:underline"
                      >
                        <span className="font-medium">{program.code}</span>
                        <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                          {program.name}
                        </span>
                      </Link>
                    </td>
                    {/* One form per row; each control saves the row when changed. */}
                    <td className="px-3 py-2" colSpan={3}>
                      <form
                        action={updateProgramPlacement.bind(null, program.id)}
                        className="flex flex-wrap items-center gap-6"
                      >
                        <AutoSubmitSelect
                          name="collegeId"
                          defaultValue={program.collegeId ?? ""}
                          className={`${inputClass} w-40`}
                        >
                          <option value="">Unassigned</option>
                          {colleges.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code}
                            </option>
                          ))}
                        </AutoSubmitSelect>
                        <AutoSubmitInput
                          name="yearEstablished"
                          type="number"
                          min={1900}
                          max={2200}
                          placeholder="e.g. 2005"
                          defaultValue={program.yearEstablished}
                          aria-label={`Year established for ${program.code}`}
                          className={`${inputClass} w-28`}
                        />
                        <AutoSubmitInput
                          name="revisionCycleYears"
                          type="number"
                          min={1}
                          max={50}
                          defaultValue={program.revisionCycleYears}
                          aria-label={`Revision cycle for ${program.code}`}
                          className={`${inputClass} w-20`}
                        />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Colleges</h2>
        {colleges.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No colleges yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {colleges.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{c.code}</span>
                  <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                    {c.name}
                  </span>
                  <span className="ml-2 text-xs text-neutral-400">
                    {programs.filter((p) => p.collegeId === c.id).length}{" "}
                    program(s)
                  </span>
                </span>
                <form action={deleteCollege.bind(null, c.id)}>
                  <DeleteButton />
                </form>
              </li>
            ))}
          </ul>
        )}
        <form
          action={createCollege}
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              placeholder="CCS"
              className={`${inputClass} mt-1 block w-28`}
            />
          </label>
          <label className="text-sm">
            Name
            <input
              name="name"
              required
              maxLength={255}
              placeholder="College of Computer Studies"
              className={`${inputClass} mt-1 block w-72`}
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Add College
          </button>
        </form>
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
