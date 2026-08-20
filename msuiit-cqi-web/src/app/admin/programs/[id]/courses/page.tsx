import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type CurriculumCourse, type Program } from '@/lib/api';

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

function groupKey(cc: CurriculumCourse): string {
  return `${cc.yearLevel ?? ''}::${cc.term ?? ''}`;
}

function groupLabel(cc: CurriculumCourse): { year: string; term: string } {
  return {
    year: cc.yearLevel != null ? `Year ${cc.yearLevel}` : 'Unassigned Year',
    term: cc.term || 'Unassigned Term',
  };
}

export default async function ProgramCoursesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram(id);
  const curriculumCourses = await apiFetch<CurriculumCourse[]>(
    `/curriculum-courses?programId=${program.id}`,
  );

  const groups = new Map<string, CurriculumCourse[]>();
  for (const cc of curriculumCourses) {
    const key = groupKey(cc);
    const list = groups.get(key) ?? [];
    list.push(cc);
    groups.set(key, list);
  }

  const sortedGroups = [...groups.entries()].sort(([, aList], [, bList]) => {
    const a = aList[0];
    const b = bList[0];
    const yearA = a.yearLevel ?? Infinity;
    const yearB = b.yearLevel ?? Infinity;
    if (yearA !== yearB) return yearA - yearB;
    return (a.term ?? '￿').localeCompare(b.term ?? '￿');
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Courses — {program.code}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Arranged by year level and semester/term.
        </p>
      </div>

      {curriculumCourses.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No courses linked to this program yet —{' '}
          <Link href={`/admin/programs/${program.id}`} className="underline">
            add some in Program Settings
          </Link>
          .
        </p>
      ) : (
        sortedGroups.map(([key, courses]) => {
          const { year, term } = groupLabel(courses[0]);
          const sortedCourses = [...courses].sort((a, b) =>
            a.course.code.localeCompare(b.course.code),
          );
          return (
            <section key={key}>
              <h2 className="text-lg font-medium">
                {year} &mdash; {term}
              </h2>
              <ul className="mt-2 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                {sortedCourses.map((cc) => (
                  <li key={cc.id}>
                    <Link
                      href={`/admin/programs/${program.id}/courses/${cc.course.id}`}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    >
                      <span>
                        <span className="font-medium">{cc.course.code}</span>
                        <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                          {cc.course.title}
                        </span>
                        {cc.electiveGroup && (
                          <span className="ml-2 text-xs text-neutral-400">
                            ({cc.electiveGroup})
                          </span>
                        )}
                      </span>
                      <span className="text-neutral-400">&rarr;</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
