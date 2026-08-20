import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Clo, type CurriculumCourse, type CurriculumVersion, type CloPloMapping, type Course, type MappingLevel, type Plo, type Program } from '@/lib/api';
import { buildPloSummary } from '@/lib/mapping-summary';
import { buildLevelColors } from '@/lib/mapping-level-colors';
import { MappingSummaryTable } from '@/components/mapping-summary-table';
import { WeightComputationTable } from '@/components/weight-computation-table';
import { AutoSubmitCheckbox } from '@/components/auto-submit-checkbox';
import { ExpandAllCheckbox } from '@/components/expand-all-checkbox';
import { MappingTable } from './mapping-table';

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

export default async function MappingsPage({
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
  const levelColors = buildLevelColors(mappingLevels);
  const ploAssessmentCourseIds = curriculumCourses
    .filter((cc) => cc.isPloAssessmentTarget)
    .map((cc) => cc.courseId);
  const showOnlyPloAssessment = onlyPloAssessment === '1';

  const selectedVersionId = versionIdParam || curriculumVersions[0]?.id;
  const [allCourses, mappings] = await Promise.all([
    apiFetch<CourseWithClos[]>(
      `/courses?programId=${program.id}${selectedVersionId ? `&curriculumVersionId=${selectedVersionId}` : ''}`,
    ),
    selectedVersionId
      ? apiFetch<CloPloMapping[]>(`/mappings?curriculumVersionId=${selectedVersionId}`)
      : Promise.resolve([] as CloPloMapping[]),
  ]);
  const courses = showOnlyPloAssessment
    ? allCourses.filter((c) => ploAssessmentCourseIds.includes(c.id))
    : allCourses;

  const summaryRows = buildPloSummary(plos, courses, mappings);

  if (curriculumVersions.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No curriculum versions set up for this program yet — CLO-PLO mapping
        is scoped per version, so{' '}
        <Link href={`/admin/programs/${program.id}`} className="underline">
          add one in Admin
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Mapping level per course learning outcome:{' '}
          {mappingLevels.map((level) => (
            <span key={level.id}>
              <span className={`font-medium ${levelColors[level.id]?.text ?? ''}`}>
                {level.displayCode} = {level.label}
              </span>
              {', '}
            </span>
          ))}
          Each curriculum version has its own mapping.
        </p>
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
            View
          </button>
        </form>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No courses set up for this program yet —{' '}
          <Link href={`/admin/programs/${program.id}`} className="underline">
            add some in Admin
          </Link>
          .
        </p>
      ) : (
        <div className="clo-expand-scope space-y-2">
          <ExpandAllCheckbox />
          <div className="max-h-[70vh] overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <MappingTable
              programId={program.id}
              programCode={program.code}
              curriculumVersionId={selectedVersionId ?? ''}
              courses={courses}
              plos={plos}
              mappings={mappings}
              ploAssessmentCourseIds={ploAssessmentCourseIds}
              mappingLevels={mappingLevels}
              levelColors={levelColors}
            />
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
            Each mapping level contributes its configured weight (
            {mappingLevels.map((level, i) => (
              <span key={level.id}>
                {i > 0 && ', '}
                {level.displayCode} = {level.weight}
              </span>
            ))}
            ) toward a PLO&apos;s weighted total — the same weights used to
            compute PLO attainment. Click a row to see the subtotal per
            course.
          </p>
          <div className="mt-3">
            <WeightComputationTable rows={summaryRows} mappingLevels={mappingLevels} />
          </div>
        </div>
      )}
    </div>
  );
}
