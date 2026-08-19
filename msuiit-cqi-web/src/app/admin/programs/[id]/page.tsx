import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  apiFetch,
  ApiError,
  type AttainmentBenchmark,
  type Cohort,
  type CohortAdviser,
  type Course,
  type CurriculumCourse,
  type CurriculumVersion,
  type Faculty,
  type MappingLevel,
  type Plo,
  type Program,
} from '@/lib/api';
import {
  createAndLinkCourse,
  createCohort,
  createCurriculumVersion,
  createPlo,
  deleteCurriculumVersion,
  deletePlo,
  linkExistingCourse,
  unlinkCourse,
  updateAttainmentBenchmark,
  updateMappingLevelWeights,
  updateProgramIdentity,
} from '../../actions';
import { BatchRow } from './batch-row';

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

export default async function AdminProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram(id);

  const [
    cohorts,
    curriculumVersions,
    plos,
    curriculumCourses,
    allCourses,
    faculty,
    cohortAdvisers,
    mappingLevels,
    benchmark,
  ] = await Promise.all([
    apiFetch<Cohort[]>(`/cohorts?programId=${program.id}`),
    apiFetch<CurriculumVersion[]>(`/curriculum-versions?programId=${program.id}`),
    apiFetch<Plo[]>(`/plos?programId=${program.id}`),
    apiFetch<CurriculumCourse[]>(`/curriculum-courses?programId=${program.id}`),
    apiFetch<Course[]>('/courses'),
    apiFetch<Faculty[]>(`/faculty?programId=${program.id}`),
    apiFetch<CohortAdviser[]>('/cohort-advisers'),
    apiFetch<MappingLevel[]>(`/mapping-levels?programId=${program.id}`),
    apiFetch<AttainmentBenchmark>(`/attainment-benchmark?programId=${program.id}`),
  ]);

  const linkedCourseIds = new Set(curriculumCourses.map((cc) => cc.courseId));
  const availableCourses = allCourses.filter((c) => !linkedCourseIds.has(c.id));

  const advisersByCohort = new Map<string, CohortAdviser[]>();
  for (const ca of cohortAdvisers) {
    const list = advisersByCohort.get(ca.cohortId) ?? [];
    list.push(ca);
    advisersByCohort.set(ca.cohortId, list);
  }
  const activeFaculty = faculty.filter((f) => f.isActive);

  const boundCreateCohort = createCohort.bind(null, program.id);
  const boundCreateCurriculumVersion = createCurriculumVersion.bind(null, program.id);
  const boundCreatePlo = createPlo.bind(null, program.id);
  const boundLinkExistingCourse = linkExistingCourse.bind(null, program.id);
  const boundCreateAndLinkCourse = createAndLinkCourse.bind(null, program.id);

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; Programs
        </Link>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              {program.code} — {program.name}
            </h1>
            {program.description && (
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                {program.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/admin/programs/${program.id}/mappings`}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              Edit CLO-PLO Mapping
            </Link>
            <Link
              href={`/programs/${program.code}`}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              View
            </Link>
          </div>
        </div>
      </div>

      <section className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Program Name &amp; Code</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Changing the code changes this program&apos;s public URL (
          <code>/programs/{program.code}</code>) — old links using the
          previous code will stop resolving.
        </p>
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
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Batches</h2>
          <Link
            href={`/admin/programs/${program.id}/faculty`}
            className="text-sm text-neutral-500 hover:underline"
          >
            Manage Faculty &rarr;
          </Link>
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Each batch keeps its own CLO-PLO mapping, since curricula get revised
          between cohorts.
        </p>
        {cohorts.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No batches yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {cohorts.map((cohort) => {
              const advisers = advisersByCohort.get(cohort.id) ?? [];
              const assignedFacultyIds = new Set(advisers.map((a) => a.facultyId));
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
      </section>

      <section>
        <h2 className="text-lg font-medium">Curriculum Versions</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          CLOs and CLO-PLO/PI mappings belong to a curriculum version, not a
          batch directly — set these up independently of batches, then assign
          a batch to whichever version it was admitted under (above) whenever
          that's ready.
        </p>
        {curriculumVersions.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No curriculum versions yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {curriculumVersions.map((version) => (
              <li key={version.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-medium">{version.code}</span>
                  {version.description && (
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {version.description}
                    </span>
                  )}
                </div>
                <form action={deleteCurriculumVersion.bind(null, program.id, version.id)}>
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
          <label className="text-sm sm:col-span-3">
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
      </section>

      <section className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Mapping Level Weights</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Used to compute weighted PLO/CLO attainment from I/P/D mapping levels
          — changing these affects every attainment report and the CLO-PLO
          weight computation table immediately.
        </p>
        <form
          action={updateMappingLevelWeights.bind(null, program.id)}
          className="mt-3 flex flex-wrap items-end gap-4"
        >
          {mappingLevels.map((level) => (
            <label key={level.code} className="text-sm">
              {level.label} ({level.code})
              <input
                name={`weight_${level.code}`}
                type="number"
                min={1}
                required
                defaultValue={level.weight}
                className="mt-1 block w-24 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
          ))}
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Save Weights
          </button>
        </form>
      </section>

      <section className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Attainment Benchmark</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Score threshold below which a student&apos;s CLO attainment is
          flagged in the CLO Attainments table.
        </p>
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
      </section>

      <section>
        <h2 className="text-lg font-medium">Program Learning Outcomes</h2>
        {plos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No PLOs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {plos.map((plo) => (
              <li key={plo.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-medium">{plo.code}</span>
                  <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                    {plo.description}
                  </span>
                </div>
                <form action={deletePlo.bind(null, program.id, plo.id)}>
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
          action={boundCreatePlo}
          className="mt-3 grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
        >
          <label className="text-sm">
            Code
            <input
              name="code"
              required
              maxLength={20}
              placeholder="PLO1"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Description
            <input
              name="description"
              required
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-sm">
            Display order
            <input
              name="displayOrder"
              type="number"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Add PLO
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">Courses in Program</h2>
        {curriculumCourses.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No courses yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {curriculumCourses.map((cc) => (
              <li key={cc.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <Link
                  href={`/admin/programs/${program.id}/courses/${cc.course.id}`}
                  className="text-sm hover:underline"
                >
                  <span className="font-medium">{cc.course.code}</span>
                  <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                    {cc.course.title}
                  </span>
                  <span className="ml-2 text-neutral-400">
                    ({cc.course.clos.length} CLO{cc.course.clos.length === 1 ? '' : 's'})
                  </span>
                  {cc.yearLevel != null && (
                    <span className="ml-2 text-neutral-400">Y{cc.yearLevel}</span>
                  )}
                  {cc.term && <span className="ml-2 text-neutral-400">{cc.term}</span>}
                  {cc.electiveGroup && (
                    <span className="ml-2 text-neutral-400">{cc.electiveGroup}</span>
                  )}
                </Link>
                <form action={unlinkCourse.bind(null, program.id, cc.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <form
            action={boundLinkExistingCourse}
            className="grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <h3 className="text-sm font-medium">Link existing course</h3>
            <label className="text-sm">
              Course
              <select
                name="courseId"
                required
                defaultValue=""
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="" disabled>
                  Select a course&hellip;
                </option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-sm">
                Year
                <input
                  name="yearLevel"
                  type="number"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Term
                <input
                  name="term"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Elective group
                <input
                  name="electiveGroup"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={availableCourses.length === 0}
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Link Course
            </button>
          </form>

          <form
            action={boundCreateAndLinkCourse}
            className="grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <h3 className="text-sm font-medium">Create new course</h3>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">
                Code
                <input
                  name="code"
                  required
                  maxLength={20}
                  placeholder="CS101"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Title
                <input
                  name="title"
                  required
                  maxLength={255}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
            </div>
            <label className="text-sm">
              Description
              <input
                name="description"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-sm">
                Year
                <input
                  name="yearLevel"
                  type="number"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Term
                <input
                  name="term"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <label className="text-sm">
                Elective group
                <input
                  name="electiveGroup"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
            </div>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Create &amp; Add Course
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
