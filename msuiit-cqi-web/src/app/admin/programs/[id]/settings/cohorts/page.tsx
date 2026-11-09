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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

      <form
        action={createCohort.bind(null, program.id)}
        className="grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
      >
        <h3 className="text-sm font-medium sm:col-span-4">Add cohort</h3>
        <label className="text-sm">
          Code
          <input
            name="code"
            required
            maxLength={20}
            placeholder="2022-2026"
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          Start year
          <input
            name="startYear"
            type="number"
            required
            placeholder="2022"
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          End year
          <input
            name="endYear"
            type="number"
            required
            placeholder="2026"
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          Description
          <input name="description" className={inputClass} />
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
