import { notFound } from "next/navigation";
import {
  apiFetch,
  ApiError,
  type Course,
  type CourseCategory,
  type CurriculumCourse,
  type Program,
} from "@/lib/api";
import {
  createAndLinkCourse,
  linkExistingCourse,
  setCourseCategory,
  setCourseSchedule,
} from "../../../actions";
import { ScheduleSelect } from "./schedule-select";
import { CategorySelect } from "./category-select";
import { AddCoursePanel } from "./add-course-panel";
import { CourseTableRow } from "./course-table-row";
import { rowTone, YEAR_SWATCHES } from "./row-tone";

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

const CATEGORY_LABELS: Record<CourseCategory, string> = {
  MAJOR: "Major",
  MINOR: "Minor",
  ELECTIVE: "Elective",
};

// Semesters every year card always offers as drop targets; Summer only shows
// when a course is placed there.
const STANDARD_TERMS = ["1st Sem", "2nd Sem"];
const MIN_YEARS = 4;

// A course in an elective group counts as elective unless explicitly categorized.
function effectiveCategory(cc: CurriculumCourse): CourseCategory | null {
  return cc.category ?? (cc.electiveGroup ? "ELECTIVE" : null);
}

function units(cc: CurriculumCourse): number {
  return cc.course.credits ?? 0;
}

// Unit totals over active courses only.
function summarize(list: CurriculumCourse[]) {
  const t = { total: 0, MAJOR: 0, MINOR: 0, ELECTIVE: 0, uncategorized: 0 };
  for (const cc of list) {
    if (!cc.isActive) continue;
    t.total += units(cc);
    const category = effectiveCategory(cc);
    if (category) t[category] += units(cc);
    else t.uncategorized += units(cc);
  }
  return t;
}

const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];

function yearName(yearLevel: number | null): string {
  if (yearLevel == null) return "Unassigned Year";
  return `${ORDINALS[yearLevel - 1] ?? `Year ${yearLevel}`} Year`;
}

function termRank(term: string): number {
  const i = STANDARD_TERMS.indexOf(term);
  return i === -1 ? STANDARD_TERMS.length : i;
}

export default async function ProgramCoursesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgram(id);
  const [curriculumCourses, allCourses] = await Promise.all([
    apiFetch<CurriculumCourse[]>(`/curriculum-courses?programId=${program.id}`),
    apiFetch<Course[]>("/courses"),
  ]);
  const linkedIds = new Set(curriculumCourses.map((cc) => cc.courseId));
  const availableCourses = allCourses.filter((c) => !linkedIds.has(c.id));

  const totals = summarize(curriculumCourses);

  const sortedCourses = [...curriculumCourses].sort(
    (a, b) =>
      (a.yearLevel ?? 99) - (b.yearLevel ?? 99) ||
      termRank(a.term ?? "") - termRank(b.term ?? "") ||
      a.course.code.localeCompare(b.course.code),
  );

  // Year -> term -> courses. Years 1..4 and the two standard semesters always
  // exist so an empty card can still receive a dropped course.
  const maxYear = Math.max(
    MIN_YEARS,
    ...curriculumCourses.map((cc) => cc.yearLevel ?? 0),
  );
  const years: (number | null)[] = Array.from(
    { length: maxYear },
    (_, i) => i + 1,
  );
  if (curriculumCourses.some((cc) => cc.yearLevel == null)) years.push(null);

  const yearBlocks = years.map((yearLevel) => {
    const inYear = curriculumCourses.filter(
      (cc) => (cc.yearLevel ?? null) === yearLevel,
    );
    const termNames = new Set<string>(yearLevel == null ? [] : STANDARD_TERMS);
    for (const cc of inYear) termNames.add(cc.term ?? "");
    const terms = [...termNames]
      .sort((a, b) => termRank(a) - termRank(b) || a.localeCompare(b))
      .map((term) => ({
        term,
        courses: inYear
          .filter((cc) => (cc.term ?? "") === term)
          .sort((a, b) => a.course.code.localeCompare(b.course.code)),
      }));
    return { yearLevel, courses: inYear, terms };
  });

  // Average over semesters that actually carry units (skips the unassigned bucket).
  const termTotals = yearBlocks
    .filter((y) => y.yearLevel != null)
    .flatMap((y) => y.terms.filter((t) => t.term))
    .map((t) => summarize(t.courses).total)
    .filter((n) => n > 0);
  const avgPerSemester = termTotals.length
    ? Math.round(
        (termTotals.reduce((a, b) => a + b, 0) / termTotals.length) * 10,
      ) / 10
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Courses — {program.code}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          All courses in one table, ordered by year level and semester. Click
          the pencil on a course to change its year, semester or category.
        </p>
      </div>

      <AddCoursePanel
        availableCourses={availableCourses}
        linkAction={linkExistingCourse.bind(null, program.id)}
        createAction={createAndLinkCourse.bind(null, program.id)}
      />

      {curriculumCourses.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {(
            [
              ["Total units", totals.total],
              ["Avg units / semester", avgPerSemester],
              ["Major", totals.MAJOR],
              ["Minor", totals.MINOR],
              ["Elective", totals.ELECTIVE],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="text-2xl font-semibold">{value}</div>
              <div className="text-sm text-neutral-500">{label}</div>
            </div>
          ))}
        </div>
      )}
      {totals.uncategorized > 0 && (
        <p className="text-xs text-neutral-500">
          {totals.uncategorized} unit{totals.uncategorized === 1 ? "" : "s"} not
          yet categorized as major, minor or elective — set a category on each
          course below.
        </p>
      )}

      {curriculumCourses.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No courses yet &mdash; use &ldquo;Add course&rdquo; above.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
            {YEAR_SWATCHES.map(([year, swatch]) => (
              <span key={year} className="flex items-center gap-1.5">
                <span className={`inline-block h-3 w-3 rounded-sm ${swatch}`} />
                Year {year}
              </span>
            ))}
            <span>
              Lighter shade = 1st Sem, deeper = 2nd Sem, deepest = Summer
            </span>
          </p>
          <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-900">
                <tr>
                  <th className="px-3 py-2 text-left">Code</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Year level</th>
                  <th className="px-3 py-2 text-left">Semester</th>
                  <th className="px-3 py-2 text-right">Units</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {sortedCourses.map((cc) => {
                  const category = effectiveCategory(cc);
                  return (
                    <CourseTableRow
                      key={cc.id}
                      href={`/admin/programs/${program.id}/courses/${cc.course.id}`}
                      code={cc.course.code}
                      title={cc.course.title}
                      electiveGroup={cc.electiveGroup ?? null}
                      yearLabel={yearName(cc.yearLevel ?? null)}
                      termLabel={cc.term ?? "—"}
                      unitsLabel={`${cc.course.credits ?? "—"}`}
                      tone={rowTone(cc.yearLevel ?? null, cc.term ?? null)}
                      categoryLabel={
                        category ? CATEGORY_LABELS[category] : "Uncategorized"
                      }
                      scheduleEditor={
                        <ScheduleSelect
                          action={setCourseSchedule.bind(
                            null,
                            program.id,
                            cc.id,
                          )}
                          yearLevel={cc.yearLevel}
                          term={cc.term}
                          label={cc.course.code}
                        />
                      }
                      categoryEditor={
                        <CategorySelect
                          action={setCourseCategory.bind(
                            null,
                            program.id,
                            cc.id,
                          )}
                          value={cc.category}
                          emptyLabel={
                            cc.electiveGroup
                              ? "Elective (auto)"
                              : "Uncategorized"
                          }
                          label={`Category for ${cc.course.code}`}
                        />
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
