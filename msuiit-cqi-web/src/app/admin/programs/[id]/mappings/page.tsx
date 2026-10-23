import Link from "next/link";
import { notFound } from "next/navigation";
import {
  apiFetch,
  ApiError,
  type Clo,
  type CurriculumCourse,
  type CurriculumVersion,
  type CloPloMapping,
  type Course,
  type MappingLevel,
  type Plo,
  type Program,
} from "@/lib/api";
import { MappingTable } from "@/app/programs/[id]/(tabs)/mappings/mapping-table";
import { buildLevelColors } from "@/lib/mapping-level-colors";
import { copyMappingsFromVersion } from "./actions";
import { buildPloSummary } from "@/lib/mapping-summary";
import { MappingSummaryTable } from "@/components/mapping-summary-table";
import { WeightComputationTable } from "@/components/weight-computation-table";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { AutoSubmitCheckbox } from "@/components/auto-submit-checkbox";
import { ExpandAllCheckbox } from "@/components/expand-all-checkbox";
import { iconLinkClass, PencilIcon } from "@/components/icon-buttons";

export const dynamic = "force-dynamic";

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
  searchParams: Promise<{
    curriculumVersionId?: string;
    onlyPloAssessment?: string;
  }>;
}) {
  const { id } = await params;
  const { curriculumVersionId: versionIdParam, onlyPloAssessment } =
    await searchParams;
  const program = await getProgram(id);

  const [curriculumVersions, plos, mappingLevels, curriculumCourses] =
    await Promise.all([
      apiFetch<CurriculumVersion[]>(
        `/curriculum-versions?programId=${program.id}`,
      ),
      apiFetch<Plo[]>(`/plos?programId=${program.id}`),
      apiFetch<MappingLevel[]>(`/mapping-levels?programId=${program.id}`),
      apiFetch<CurriculumCourse[]>(
        `/curriculum-courses?programId=${program.id}`,
      ),
    ]);
  const ploAssessmentCourseIds = new Set(
    curriculumCourses
      .filter((cc) => cc.isPloAssessmentTarget)
      .map((cc) => cc.courseId),
  );
  const showOnlyPloAssessment = onlyPloAssessment === "1";
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
          No curriculum versions set up yet — add one above before mapping CLOs
          to PLOs.
        </p>
      </div>
    );
  }

  const selectedVersionId = versionIdParam || curriculumVersions[0].id;
  const [allCourses, mappings] = await Promise.all([
    apiFetch<CourseWithClos[]>(
      `/courses?programId=${program.id}&curriculumVersionId=${selectedVersionId}`,
    ),
    apiFetch<CloPloMapping[]>(
      `/mappings?curriculumVersionId=${selectedVersionId}`,
    ),
  ]);
  const courses = showOnlyPloAssessment
    ? allCourses.filter((c) => ploAssessmentCourseIds.has(c.id))
    : allCourses;

  const summaryRows = buildPloSummary(plos, courses, mappings);

  const otherVersions = curriculumVersions.filter(
    (v) => v.id !== selectedVersionId,
  );
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
          Click the pencil on a course to edit its CLOs and set the mapping
          level:{" "}
          {mappingLevels.map((level) => (
            <span key={level.id}>
              <span
                className={`font-medium ${levelColors[level.id]?.text ?? ""}`}
              >
                {level.displayCode} = {level.label}
              </span>
              {", "}
            </span>
          ))}
          — = not mapped. Each curriculum version has its own mapping — changes
          save immediately.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form method="get" className="flex items-end gap-2">
          <label className="text-sm">
            Curriculum Version
            <AutoSubmitSelect
              name="curriculumVersionId"
              defaultValue={selectedVersionId}
              className="mt-1 block w-48 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              {curriculumVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code}
                </option>
              ))}
            </AutoSubmitSelect>
          </label>
          <AutoSubmitCheckbox
            name="onlyPloAssessment"
            value="1"
            defaultChecked={showOnlyPloAssessment}
            label="Only PLO assessment courses"
          />
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
            ? "No courses set up for this program yet — add some above."
            : "No PLOs set up for this program yet — add some above."}
        </p>
      ) : (
        <div className="clo-expand-scope space-y-2">
          <ExpandAllCheckbox />
          <div className="max-h-[70vh] overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <MappingTable
              editable
              programId={program.id}
              programCode={program.code}
              curriculumVersionId={selectedVersionId}
              courses={courses}
              plos={plos}
              mappings={mappings}
              ploAssessmentCourseIds={[...ploAssessmentCourseIds]}
              mappingLevels={mappingLevels}
              levelColors={levelColors}
            />
          </div>
        </div>
      )}

      {plos.length > 0 && (
        <div>
          <h2 className="text-lg font-medium">
            Summary — mapping level count per PLO
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Click a column header to sort, or a row to see which courses
            contribute to its counts.
          </p>
          <div className="mt-3">
            <MappingSummaryTable
              rows={summaryRows}
              mappingLevels={mappingLevels}
              levelColors={levelColors}
            />
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
              className={iconLinkClass}
            >
              <PencilIcon />
            </Link>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Current weights:{" "}
            {mappingLevels.map((level, i) => (
              <span key={level.id}>
                {i > 0 && ", "}
                {level.displayCode} = {level.weight}
              </span>
            ))}
            . Same weights used to compute PLO attainment. Click a row to see
            the subtotal per course.
          </p>
          <div className="mt-3">
            <WeightComputationTable
              rows={summaryRows}
              mappingLevels={mappingLevels}
            />
          </div>
        </div>
      )}
    </div>
  );
}
