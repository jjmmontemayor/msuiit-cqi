import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Clo, type CurriculumCourse, type CurriculumVersion, type CloPloMapping, type Course, type MappingLevel, type Plo, type Program } from '@/lib/api';
import { MappingCell } from './mapping-cell';
import { buildLevelColors } from '@/lib/mapping-level-colors';
import { copyMappingsFromVersion } from './actions';
import { buildPloSummary } from '@/lib/mapping-summary';
import { MappingSummaryTable } from '@/components/mapping-summary-table';
import { WeightComputationTable } from '@/components/weight-computation-table';
import { AutoSubmitCheckbox } from '@/components/auto-submit-checkbox';
import { ClampableText } from '@/components/clampable-text';
import { ExpandAllCheckbox } from '@/components/expand-all-checkbox';

export const dynamic = 'force-dynamic';

type CourseWithClos = Course & { clos: Clo[] };

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

export default async function AdminMappingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ curriculumVersionId?: string; onlyPloAssessment?: string }>;
}) {
  const { id } = await params;
  const { curriculumVersionId: versionIdParam, onlyPloAssessment } = await searchParams;
  const program = await getProgram(id);

  const [curriculumVersions, plos, mappingLevels, curriculumCourses] = await Promise.all([
    apiFetch<CurriculumVersion[]>(`/curriculum-versions?programId=${program.id}`),
    apiFetch<Plo[]>(`/plos?programId=${program.id}`),
    apiFetch<MappingLevel[]>(`/mapping-levels?programId=${program.id}`),
    apiFetch<CurriculumCourse[]>(`/curriculum-courses?programId=${program.id}`),
  ]);
  const ploAssessmentCourseIds = new Set(
    curriculumCourses.filter((cc) => cc.isPloAssessmentTarget).map((cc) => cc.courseId),
  );
  const showOnlyPloAssessment = onlyPloAssessment === '1';
  const levelColors = buildLevelColors(mappingLevels);

  if (curriculumVersions.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href={`/admin/programs/${program.id}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; {program.code}
        </Link>
        <p className="text-sm text-neutral-500">
          No curriculum versions set up yet — add one above before mapping CLOs to PLOs.
        </p>
      </div>
    );
  }

  const selectedVersionId = versionIdParam || curriculumVersions[0].id;
  const [allCourses, mappings] = await Promise.all([
    apiFetch<CourseWithClos[]>(
      `/courses?programId=${program.id}&curriculumVersionId=${selectedVersionId}`,
    ),
    apiFetch<CloPloMapping[]>(`/mappings?curriculumVersionId=${selectedVersionId}`),
  ]);
  const courses = showOnlyPloAssessment
    ? allCourses.filter((c) => ploAssessmentCourseIds.has(c.id))
    : allCourses;

  const levelByCloAndPlo = new Map<string, CloPloMapping>();
  for (const m of mappings) {
    levelByCloAndPlo.set(`${m.cloId}::${m.ploId}`, m);
  }

  const summaryRows = buildPloSummary(plos, courses, mappings);

  const otherVersions = curriculumVersions.filter((v) => v.id !== selectedVersionId);
  const boundCopyMappings = copyMappingsFromVersion.bind(
    null,
    program.id,
    selectedVersionId,
  );

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div>
        <Link
          href={`/admin/programs/${program.id}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          &larr; {program.code}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          CLO-PLO Mapping — {program.code}
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Click a cell to set the mapping level:{' '}
          {mappingLevels.map((level) => (
            <span key={level.id}>
              <span className={`font-medium ${levelColors[level.id]?.text ?? ''}`}>
                {level.displayCode} = {level.label}
              </span>
              {', '}
            </span>
          ))}
          — = not mapped. Each curriculum version has its own mapping — changes save immediately.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form method="get" className="flex items-end gap-2">
          <label className="text-sm">
            Curriculum Version
            <select
              name="curriculumVersionId"
              defaultValue={selectedVersionId}
              className="mt-1 block w-48 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              {curriculumVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code}
                </option>
              ))}
            </select>
          </label>
          <AutoSubmitCheckbox
            name="onlyPloAssessment"
            value="1"
            defaultChecked={showOnlyPloAssessment}
            label="Only PLO assessment courses"
          />
          <button
            type="submit"
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
          >
            Switch
          </button>
        </form>

        {otherVersions.length > 0 && (
          <form action={boundCopyMappings} className="flex items-end gap-2">
            <label className="text-sm">
              Copy from
              <select
                name="sourceCurriculumVersionId"
                defaultValue=""
                className="mt-1 block w-48 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="" disabled>
                  Select a version&hellip;
                </option>
                {otherVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.code}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              Copy missing CLOs &amp; mappings
            </button>
          </form>
        )}
      </div>

      {courses.length === 0 || plos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {courses.length === 0
            ? 'No courses set up for this program yet — add some above.'
            : 'No PLOs set up for this program yet — add some above.'}
        </p>
      ) : (
        <div className="clo-expand-scope space-y-2">
          <ExpandAllCheckbox />
          <div className="max-h-[70vh] overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-neutral-100 dark:bg-neutral-900">
              <tr>
                <th className="sticky left-0 z-30 bg-neutral-100 px-3 py-2 text-left dark:bg-neutral-900">
                  Course
                </th>
                <th className="sticky left-[9rem] z-30 bg-neutral-100 px-3 py-2 text-left dark:bg-neutral-900">
                  CLO
                </th>
                {plos.map((plo) => (
                  <th key={plo.id} className="px-3 py-2 text-center" title={plo.description}>
                    {plo.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((course) =>
                course.clos.map((clo, cloIdx) => (
                  <tr
                    key={clo.id}
                    className="border-t border-neutral-200 dark:border-neutral-800"
                  >
                    {cloIdx === 0 && (
                      <td
                        rowSpan={course.clos.length}
                        title={
                          ploAssessmentCourseIds.has(course.id)
                            ? 'Designated for formal PLO assessment'
                            : undefined
                        }
                        className={`sticky left-0 z-10 w-36 whitespace-nowrap px-3 py-1.5 align-top font-medium ${
                          ploAssessmentCourseIds.has(course.id)
                            ? 'bg-emerald-50 dark:bg-emerald-950/40'
                            : 'bg-white dark:bg-neutral-950'
                        }`}
                      >
                        <Link
                          href={`/programs/${program.code}/courses/${course.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          <div>{course.code}</div>
                          <div className="whitespace-normal text-xs font-normal text-neutral-500 dark:text-neutral-400">
                            {course.title}
                          </div>
                        </Link>
                      </td>
                    )}
                    <td className="sticky left-[9rem] z-10 w-64 bg-white px-3 py-1.5 align-top dark:bg-neutral-950">
                      <div className="font-medium text-neutral-800 dark:text-neutral-200">
                        {clo.code}
                      </div>
                      <ClampableText
                        text={clo.description}
                        className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400"
                      />
                    </td>
                    {plos.map((plo) => {
                      const mapping = levelByCloAndPlo.get(`${clo.id}::${plo.id}`);
                      return (
                        <td key={plo.id} className="px-3 py-1.5 text-center">
                          <MappingCell
                            programId={program.id}
                            curriculumVersionId={selectedVersionId}
                            cloId={clo.id}
                            ploId={plo.id}
                            initialMappingLevelId={mapping?.mappingLevelId ?? ''}
                            mappingLevels={mappingLevels}
                            levelColors={levelColors}
                          />
                        </td>
                      );
                    })}
                  </tr>
                )),
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {plos.length > 0 && (
        <div>
          <h2 className="text-lg font-medium">Summary — mapping level count per PLO</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Click a column header to sort, or a row to see which courses contribute
            to its counts.
          </p>
          <div className="mt-3">
            <MappingSummaryTable rows={summaryRows} mappingLevels={mappingLevels} levelColors={levelColors} />
          </div>
        </div>
      )}

      {plos.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-medium">CLO-PLO Weight Computation</h2>
            <Link
              href={`/admin/programs/${program.id}`}
              title="Edit weights"
              aria-label="Edit weights"
              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
              </svg>
            </Link>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Current weights:{' '}
            {mappingLevels.map((level, i) => (
              <span key={level.id}>
                {i > 0 && ', '}
                {level.displayCode} = {level.weight}
              </span>
            ))}
            . Same weights used to compute PLO attainment. Click a row to see
            the subtotal per course.
          </p>
          <div className="mt-3">
            <WeightComputationTable rows={summaryRows} mappingLevels={mappingLevels} />
          </div>
        </div>
      )}
    </div>
  );
}
