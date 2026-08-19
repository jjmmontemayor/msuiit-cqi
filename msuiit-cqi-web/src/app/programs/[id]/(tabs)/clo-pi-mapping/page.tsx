import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  apiFetch,
  ApiError,
  type Clo,
  type CurriculumVersion,
  type CloPloMapping,
  type Course,
  type Plo,
  type Program,
} from '@/lib/api';
import { LEVEL_BADGE_CLASSES } from '@/lib/mapping-level-colors';
import { PiToggleCell } from './pi-cell';

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

export default async function CloPiMappingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ curriculumVersionId?: string }>;
}) {
  const { id } = await params;
  const { curriculumVersionId: versionIdParam } = await searchParams;
  const program = await getProgram(id);

  const [curriculumVersions, plos] = await Promise.all([
    apiFetch<CurriculumVersion[]>(`/curriculum-versions?programId=${program.id}`),
    apiFetch<Plo[]>(`/plos?programId=${program.id}`),
  ]);

  if (curriculumVersions.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No curriculum versions set up for this program yet — CLO-PI mapping
        is scoped per version, so{' '}
        <Link href={`/admin/programs/${program.id}`} className="underline">
          add one in Admin
        </Link>
        .
      </p>
    );
  }

  const selectedVersionId = versionIdParam || curriculumVersions[0].id;
  const [courses, mappings] = await Promise.all([
    apiFetch<CourseWithClos[]>(
      `/courses?programId=${program.id}&curriculumVersionId=${selectedVersionId}`,
    ),
    apiFetch<CloPloMapping[]>(`/mappings?curriculumVersionId=${selectedVersionId}`),
  ]);

  const mappingByCloAndPlo = new Map<string, CloPloMapping>();
  for (const m of mappings) {
    mappingByCloAndPlo.set(`${m.cloId}::${m.ploId}`, m);
  }
  const piByPlo = new Map(plos.map((p) => [p.id, p.performanceIndicators ?? []]));

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Refine an existing CLO-PLO mapping with which Performance Indicator
          it evidences, and how it&apos;s assessed. Only CLO×PLO pairs already
          mapped (I/P/D) on the{' '}
          <Link
            href={`/programs/${program.code}/mappings?curriculumVersionId=${selectedVersionId}`}
            className="underline"
          >
            CLO-PLO Mapping
          </Link>{' '}
          tab can be given a PI here.
        </p>
      </div>

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
        <button
          type="submit"
          className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
        >
          View
        </button>
      </form>

      {courses.length === 0 || plos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {courses.length === 0
            ? 'No courses set up for this program yet.'
            : 'No PLOs set up for this program yet.'}
        </p>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-neutral-100 dark:bg-neutral-900">
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 z-30 w-36 bg-neutral-100 px-3 py-2 text-left align-bottom dark:bg-neutral-900"
                >
                  Course
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[9rem] z-30 w-64 bg-neutral-100 px-3 py-2 text-left align-bottom dark:bg-neutral-900"
                >
                  CLO
                </th>
                {plos.map((plo) => {
                  const pis = piByPlo.get(plo.id) ?? [];
                  return (
                    <th
                      key={plo.id}
                      colSpan={Math.max(pis.length, 1)}
                      className="border-l border-neutral-200 px-3 py-2 text-center dark:border-neutral-800"
                      title={plo.description}
                    >
                      {plo.code}
                    </th>
                  );
                })}
              </tr>
              <tr>
                {plos.map((plo) => {
                  const pis = piByPlo.get(plo.id) ?? [];
                  return pis.length === 0 ? (
                    <th
                      key={plo.id}
                      className="w-20 border-l border-neutral-200 px-2 py-1.5 text-center text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
                    >
                      &mdash;
                    </th>
                  ) : (
                    pis.map((pi, piIdx) => (
                      <th
                        key={pi.id}
                        title={pi.description}
                        className={`w-20 px-2 py-1.5 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 ${
                          piIdx === 0 ? 'border-l border-neutral-200 dark:border-neutral-800' : ''
                        }`}
                      >
                        {pi.code}
                      </th>
                    ))
                  );
                })}
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
                        className="sticky left-0 z-10 w-36 whitespace-nowrap bg-white px-3 py-1.5 align-top font-medium dark:bg-neutral-950"
                      >
                        {course.code}
                      </td>
                    )}
                    <td className="sticky left-[9rem] z-10 w-64 bg-white px-3 py-1.5 align-top dark:bg-neutral-950">
                      <div className="font-medium text-neutral-800 dark:text-neutral-200">
                        {clo.code}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {clo.description}
                      </div>
                    </td>
                    {plos.map((plo) => {
                      const mapping = mappingByCloAndPlo.get(`${clo.id}::${plo.id}`);
                      const pis = piByPlo.get(plo.id) ?? [];

                      if (!mapping) {
                        return (
                          <td
                            key={plo.id}
                            colSpan={Math.max(pis.length, 1)}
                            className="border-l border-neutral-200 px-2 py-1.5 text-center text-neutral-300 dark:border-neutral-800 dark:text-neutral-700"
                          >
                            &mdash;
                          </td>
                        );
                      }

                      if (pis.length === 0) {
                        return (
                          <td
                            key={plo.id}
                            className="border-l border-neutral-200 px-2 py-1.5 text-center dark:border-neutral-800"
                          >
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${LEVEL_BADGE_CLASSES[mapping.levelCode]}`}
                              title="No Performance Indicators defined for this PLO yet"
                            >
                              {mapping.levelCode}
                            </span>
                          </td>
                        );
                      }

                      return pis.map((pi, piIdx) => (
                        <td
                          key={pi.id}
                          className={`px-1 py-1.5 align-top ${
                            piIdx === 0 ? 'border-l border-neutral-200 dark:border-neutral-800' : ''
                          }`}
                        >
                          <PiToggleCell
                            programCode={program.code}
                            mappingId={mapping.id}
                            piId={pi.id}
                            isSelected={mapping.piId === pi.id}
                            initialAssessmentMethod={
                              mapping.piId === pi.id ? mapping.assessmentMethod : null
                            }
                          />
                        </td>
                      ));
                    })}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
