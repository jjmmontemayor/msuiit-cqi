import { apiFetch, type Clo, type CloPloMapping, type Course, type Plo, type Program } from '@/lib/api';

export const dynamic = 'force-dynamic';

type CourseWithClos = Course & { clos: Clo[] };

export default async function MappingsPage() {
  const programs = await apiFetch<Program[]>('/programs');
  const program = programs[0];

  if (!program) {
    return (
      <p className="text-sm text-neutral-500">
        No program found yet — run the xlsx import seed script in msuiit-cqi-api.
      </p>
    );
  }

  const [plos, courses, mappings] = await Promise.all([
    apiFetch<Plo[]>(`/plos?programId=${program.id}`),
    apiFetch<CourseWithClos[]>('/courses'),
    apiFetch<CloPloMapping[]>('/mappings'),
  ]);

  const levelByCloAndPlo = new Map<string, CloPloMapping>();
  for (const m of mappings) {
    levelByCloAndPlo.set(`${m.cloId}::${m.ploId}`, m);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">CLO-PLO Mapping — {program.code}</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Mapping level per course learning outcome: I = Introduced, P = Practiced, D
          = Demonstrated.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-900">
            <tr>
              <th className="sticky left-0 bg-neutral-100 px-3 py-2 text-left dark:bg-neutral-900">
                Course / CLO
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
                  <td className="sticky left-0 whitespace-nowrap bg-white px-3 py-1.5 dark:bg-neutral-950">
                    {cloIdx === 0 ? (
                      <span className="font-medium">{course.code}</span>
                    ) : null}
                    <span className="ml-2 text-neutral-500">{clo.code}</span>
                  </td>
                  {plos.map((plo) => {
                    const mapping = levelByCloAndPlo.get(`${clo.id}::${plo.id}`);
                    return (
                      <td key={plo.id} className="px-3 py-1.5 text-center">
                        {mapping ? (
                          <span
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs font-medium text-white dark:bg-neutral-200 dark:text-neutral-900"
                            title={mapping.assessmentMethod ?? undefined}
                          >
                            {mapping.levelCode}
                          </span>
                        ) : null}
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
  );
}
