import {
  apiFetch,
  type AttainmentBenchmark,
  type Cohort,
  type CohortAdviser,
  type CurriculumVersion,
  type Faculty,
  type MappingLevel,
  type Program,
} from "@/lib/api";
import {
  createCohort,
  createCurriculumVersion,
  createMappingLevel,
  deleteCurriculumVersion,
  deleteMappingLevel,
  updateAttainmentBenchmark,
  updateMappingLevelWeights,
  updateProgramIdentity,
} from "../../actions";
import { EditableSection } from "@/components/editable-section";
import { BatchRow } from "./batch-row";
import { DeleteButton } from "@/components/icon-buttons";

// Program Settings content (identity, batches, curriculum versions, mapping
// levels, attainment benchmark). Each block is read-only until its Edit button
// is clicked.
export async function ProgramSettingsSections({
  program,
  mappingLevelError,
}: {
  program: Program;
  mappingLevelError?: string;
}) {
  const [
    cohorts,
    curriculumVersions,
    faculty,
    cohortAdvisers,
    mappingLevels,
    benchmark,
  ] = await Promise.all([
    apiFetch<Cohort[]>(`/cohorts?programId=${program.id}`),
    apiFetch<CurriculumVersion[]>(
      `/curriculum-versions?programId=${program.id}`,
    ),
    apiFetch<Faculty[]>(`/faculty?programId=${program.id}`),
    apiFetch<CohortAdviser[]>("/cohort-advisers"),
    apiFetch<MappingLevel[]>(`/mapping-levels?programId=${program.id}`),
    apiFetch<AttainmentBenchmark>(
      `/attainment-benchmark?programId=${program.id}`,
    ),
  ]);

  const advisersByCohort = new Map<string, CohortAdviser[]>();
  for (const ca of cohortAdvisers) {
    const list = advisersByCohort.get(ca.cohortId) ?? [];
    list.push(ca);
    advisersByCohort.set(ca.cohortId, list);
  }
  const activeFaculty = faculty.filter((f) => f.isActive);

  const boundCreateCohort = createCohort.bind(null, program.id);
  const boundCreateCurriculumVersion = createCurriculumVersion.bind(
    null,
    program.id,
  );

  return (
    <div className="space-y-6">
      <EditableSection
        title="Program Name &amp; Code"
        dataKey={JSON.stringify([program.code, program.name])}
        description={
          <>
            Changing the code changes this program&apos;s public URL (
            <code>/programs/{program.code}</code>) — old links using the
            previous code will stop resolving.
          </>
        }
        view={
          <div className="text-sm">
            <span className="font-medium">{program.code}</span> &mdash;{" "}
            {program.name}
            <div className="mt-1">
              <a
                href={`/programs/${program.code}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                View public page &#8599;
              </a>
            </div>
          </div>
        }
      >
        <form
          action={updateProgramIdentity.bind(null, program.id)}
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              defaultValue={program.code}
              className="mt-1 block w-40 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Name
            <input
              name="name"
              required
              maxLength={255}
              defaultValue={program.name}
              className="mt-1 block w-full min-w-[20rem] rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Save
          </button>
        </form>
      </EditableSection>

      <EditableSection
        title="Batches"
        dataKey={JSON.stringify([cohorts, cohortAdvisers, curriculumVersions])}
        description={
          <>
            Each batch keeps its own CLO-PLO mapping, since curricula get
            revised between cohorts.
          </>
        }
        view={
          <>
            {cohorts.length === 0 ? (
              <p className="text-sm text-neutral-500">No batches yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                {cohorts.map((cohort) => {
                  const advisers = advisersByCohort.get(cohort.id) ?? [];
                  const version = curriculumVersions.find(
                    (v) => v.id === cohort.curriculumVersionId,
                  );
                  return (
                    <li key={cohort.id} className="px-4 py-2.5 text-sm">
                      <span className="font-medium">{cohort.code}</span>
                      <span className="ml-2 text-neutral-400">
                        {cohort.startYear}&ndash;{cohort.endYear}
                      </span>
                      {cohort.description && (
                        <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                          {cohort.description}
                        </span>
                      )}
                      <div className="mt-1 text-xs text-neutral-500">
                        Curriculum version: {version?.code ?? "Unassigned"}{" "}
                        &middot; Advisers:{" "}
                        {advisers.length === 0
                          ? "None assigned"
                          : advisers.map((a) => a.faculty.name).join(", ")}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        }
      >
        {cohorts.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No batches yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {cohorts.map((cohort) => {
              const advisers = advisersByCohort.get(cohort.id) ?? [];
              const assignedFacultyIds = new Set(
                advisers.map((a) => a.facultyId),
              );
              const availableFaculty = activeFaculty.filter(
                (f) => !assignedFacultyIds.has(f.id),
              );
              return (
                <BatchRow
                  key={cohort.id}
                  programId={program.id}
                  cohort={cohort}
                  advisers={advisers}
                  availableFaculty={availableFaculty}
                  curriculumVersions={curriculumVersions}
                />
              );
            })}
          </ul>
        )}

        <form
          action={boundCreateCohort}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              placeholder="2022-2025"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Start year
            <input
              name="startYear"
              type="number"
              required
              placeholder="2022"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            End year
            <input
              name="endYear"
              type="number"
              required
              placeholder="2025"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Description
            <input
              name="description"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add Batch
            </button>
          </div>
        </form>
      </EditableSection>

      <EditableSection
        title="Curriculum Versions"
        dataKey={JSON.stringify(curriculumVersions)}
        description={
          <>
            CLOs and CLO-PLO/PI mappings belong to a curriculum version, not a
            batch directly — set these up independently of batches, then assign
            a batch to whichever version it was admitted under (above) whenever
            that&apos;s ready.
          </>
        }
        view={
          <>
            {curriculumVersions.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No curriculum version yet &mdash; one is created automatically
                when the first course is added.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                {curriculumVersions.map((version) => (
                  <li key={version.id} className="px-4 py-2.5 text-sm">
                    <span className="font-medium">{version.code}</span>
                    {version.effectiveYear != null && (
                      <span className="ml-2 text-neutral-400">
                        ({version.effectiveYear})
                      </span>
                    )}
                    {version.description && (
                      <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                        {version.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        }
      >
        {curriculumVersions.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No curriculum versions yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {curriculumVersions.map((version) => (
              <li
                key={version.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="text-sm">
                  <span className="font-medium">{version.code}</span>
                  {version.effectiveYear != null && (
                    <span className="ml-2 text-neutral-400">
                      ({version.effectiveYear})
                    </span>
                  )}
                  {version.description && (
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {version.description}
                    </span>
                  )}
                </div>
                <form
                  action={deleteCurriculumVersion.bind(
                    null,
                    program.id,
                    version.id,
                  )}
                >
                  <DeleteButton />
                </form>
              </li>
            ))}
          </ul>
        )}

        <form
          action={boundCreateCurriculumVersion}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              placeholder="2018-Rev3"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Effective year
            <input
              name="effectiveYear"
              type="number"
              min={1900}
              max={2200}
              placeholder="2018"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Description
            <input
              name="description"
              placeholder="BSCS 2018 Revision 3, with corrections"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add Curriculum Version
            </button>
          </div>
        </form>
      </EditableSection>

      <EditableSection
        title="Mapping Levels"
        dataKey={JSON.stringify(mappingLevels)}
        description={
          <>
            Used to compute weighted PLO/CLO attainment — changing a weight
            affects every attainment report and the CLO-PLO weight computation
            table immediately. Add, rename, or remove levels freely; a level
            still in use by an existing CLO-PLO/CLO-PI mapping can&apos;t be
            deleted. The display code is what shows in mapping badges/selects
            (defaults to the code, but can be renamed per program).
          </>
        }
        view={
          <>
            {mappingLevelError && (
              <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                {mappingLevelError}
              </p>
            )}
            <table className="text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500">
                  <th className="pr-6 font-normal">Code</th>
                  <th className="pr-6 font-normal">Description</th>
                  <th className="pr-6 font-normal">Display code</th>
                  <th className="font-normal">Weight</th>
                </tr>
              </thead>
              <tbody>
                {mappingLevels.map((level) => (
                  <tr key={level.id}>
                    <td className="py-0.5 pr-6 font-medium">{level.code}</td>
                    <td className="pr-6">{level.label}</td>
                    <td className="pr-6">{level.displayCode}</td>
                    <td>{level.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        }
      >
        <form
          action={updateMappingLevelWeights.bind(null, program.id)}
          className="mt-3 space-y-3"
        >
          {mappingLevels.map((level) => (
            <div key={level.id} className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                Code
                <input
                  name={`code_${level.id}`}
                  required
                  maxLength={20}
                  defaultValue={level.code}
                  className="mt-1 block w-20 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Description
                <input
                  name={`label_${level.id}`}
                  required
                  maxLength={50}
                  defaultValue={level.label}
                  className="mt-1 block w-40 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Display code
                <input
                  name={`displayCode_${level.id}`}
                  required
                  maxLength={10}
                  defaultValue={level.displayCode}
                  className="mt-1 block w-20 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Weight
                <input
                  name={`weight_${level.id}`}
                  type="number"
                  min={1}
                  required
                  defaultValue={level.weight}
                  className="mt-1 block w-20 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <DeleteButton
                formAction={deleteMappingLevel.bind(null, program.id, level.id)}
              />
            </div>
          ))}
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Save
          </button>
        </form>

        <form
          action={createMappingLevel.bind(null, program.id)}
          className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
        >
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              placeholder="1"
              className="mt-1 block w-20 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Description
            <input
              name="label"
              required
              maxLength={50}
              placeholder="Introduced"
              className="mt-1 block w-40 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Display code (optional)
            <input
              name="displayCode"
              maxLength={10}
              placeholder="defaults to code"
              className="mt-1 block w-32 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Weight
            <input
              name="weight"
              type="number"
              min={1}
              required
              placeholder="1"
              className="mt-1 block w-20 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Add Mapping Level
          </button>
        </form>
      </EditableSection>

      <EditableSection
        title="Attainment Benchmark"
        dataKey={JSON.stringify(benchmark)}
        description={
          <>
            Score threshold below which a student&apos;s CLO attainment is
            flagged in the CLO Attainments table.
          </>
        }
        view={
          <p className="text-sm">
            <span className="font-medium">{benchmark.percentage}%</span>
            <span className="ml-2 text-neutral-500">
              threshold for flagging CLO attainment
            </span>
          </p>
        }
      >
        <form
          action={updateAttainmentBenchmark.bind(null, program.id)}
          className="mt-3 flex flex-wrap items-end gap-4"
        >
          <label className="text-sm">
            Benchmark %
            <input
              name="percentage"
              type="number"
              min={1}
              max={100}
              required
              defaultValue={benchmark.percentage}
              className="mt-1 block w-24 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Save Benchmark
          </button>
        </form>
      </EditableSection>
    </div>
  );
}
