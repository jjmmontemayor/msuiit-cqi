import { notFound } from "next/navigation";
import {
  apiFetch,
  ApiError,
  type Cohort,
  type CohortAdviser,
  type CurriculumVersion,
  type Faculty,
  type Program,
} from "@/lib/api";
import { createCohort } from "../../../../actions";
import { BatchRow } from "../../batch-row";
import { CohortYearFields } from "../../cohort-year-fields";

export const dynamic = "force-dynamic";

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

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export default async function CohortsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    cohort?: string;
    created?: string;
    assigned?: string;
    existing?: string;
    skipped?: string;
    invalid?: string;
    importError?: string;
  }>;
}) {
  const { id } = await params;
  const result = await searchParams;
  const program = await getProgram(id);

  const [cohorts, curriculumVersions, faculty, cohortAdvisers] =
    await Promise.all([
      apiFetch<Cohort[]>(`/cohorts?programId=${program.id}`),
      apiFetch<CurriculumVersion[]>(
        `/curriculum-versions?programId=${program.id}`,
      ),
      apiFetch<Faculty[]>(`/faculty?programId=${program.id}`),
      apiFetch<CohortAdviser[]>("/cohort-advisers"),
    ]);

  const activeFaculty = faculty.filter((f) => f.isActive);
  const advisersByCohort = new Map<string, CohortAdviser[]>();
  for (const ca of cohortAdvisers) {
    const list = advisersByCohort.get(ca.cohortId) ?? [];
    list.push(ca);
    advisersByCohort.set(ca.cohortId, list);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Cohorts</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          A cohort is a group of students admitted to the program in the same
          year (also called a batch). Each one is assigned a curriculum version
          and can have advisers.
        </p>
      </div>

      {result.importError && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Cohort {result.cohort} was added, but the student list could not be
          imported: {result.importError}
        </p>
      )}
      {result.created !== undefined && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Cohort {result.cohort} added. Students: {result.created} created
          {Number(result.assigned) > 0 && `, ${result.assigned} existing added`}
          {Number(result.existing) > 0 && `, ${result.existing} already in the cohort`}
          {Number(result.skipped) > 0 &&
            `, ${result.skipped} skipped (already in another cohort or program)`}
          {Number(result.invalid) > 0 &&
            `, ${result.invalid} rows ignored (missing number or name)`}
          .
        </p>
      )}

      <form
        action={createCohort.bind(null, program.id)}
        className="grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
      >
        <h3 className="text-sm font-medium sm:col-span-4">Add cohort</h3>
        <CohortYearFields />
        <label className="text-sm">
          Description
          <input name="description" className={inputClass} />
        </label>
        <label className="text-sm sm:col-span-4">
          Student list (optional, .xlsx / .xls / .csv)
          <input
            name="studentList"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-neutral-50 file:px-3 file:py-1.5 file:text-sm hover:file:bg-neutral-100 dark:file:border-neutral-700 dark:file:bg-neutral-900"
          />
          <span className="mt-1 block text-xs text-neutral-500">
            Needs a student number column and either a Name column
            (&ldquo;LASTNAME, Firstname&rdquo;) or separate Last name and First
            name columns. Students already in the system are not moved out of
            another cohort.
          </span>
        </label>
        <div className="sm:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Add cohort
          </button>
        </div>
      </form>

      {cohorts.length === 0 ? (
        <p className="text-sm text-neutral-500">No cohorts yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {cohorts.map((cohort) => {
            const advisers = advisersByCohort.get(cohort.id) ?? [];
            const assignedFacultyIds = new Set(advisers.map((a) => a.facultyId));
            return (
              <BatchRow
                key={cohort.id}
                programId={program.id}
                cohort={cohort}
                advisers={advisers}
                availableFaculty={activeFaculty.filter(
                  (f) => !assignedFacultyIds.has(f.id),
                )}
                curriculumVersions={curriculumVersions}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
