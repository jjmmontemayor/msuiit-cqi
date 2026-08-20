import type { Clo, CloPloMapping, Course, Plo } from './api';

type CourseWithClos = Course & { clos: Clo[] };

export interface CourseBreakdown {
  courseCode: string;
  countsByLevelId: Record<string, number>;
}

export interface PloSummaryRow {
  ploId: string;
  ploCode: string;
  ploDescription: string;
  countsByLevelId: Record<string, number>;
  courses: CourseBreakdown[];
}

export function totalCount(countsByLevelId: Record<string, number>): number {
  return Object.values(countsByLevelId).reduce((sum, n) => sum + n, 0);
}

export function buildPloSummary(
  plos: Plo[],
  courses: CourseWithClos[],
  mappings: CloPloMapping[],
): PloSummaryRow[] {
  const courseCodeByCloId = new Map<string, string>();
  for (const course of courses) {
    for (const clo of course.clos) {
      courseCodeByCloId.set(clo.id, course.code);
    }
  }

  const rows = new Map<string, PloSummaryRow>();
  for (const plo of plos) {
    rows.set(plo.id, {
      ploId: plo.id,
      ploCode: plo.code,
      ploDescription: plo.description,
      countsByLevelId: {},
      courses: [],
    });
  }

  const courseBreakdownByPlo = new Map<string, Map<string, CourseBreakdown>>();

  for (const m of mappings) {
    const row = rows.get(m.ploId);
    if (!row) continue;
    row.countsByLevelId[m.mappingLevelId] = (row.countsByLevelId[m.mappingLevelId] ?? 0) + 1;

    const courseCode = courseCodeByCloId.get(m.cloId);
    if (!courseCode) continue;

    let byCourse = courseBreakdownByPlo.get(m.ploId);
    if (!byCourse) {
      byCourse = new Map();
      courseBreakdownByPlo.set(m.ploId, byCourse);
    }
    let entry = byCourse.get(courseCode);
    if (!entry) {
      entry = { courseCode, countsByLevelId: {} };
      byCourse.set(courseCode, entry);
    }
    entry.countsByLevelId[m.mappingLevelId] = (entry.countsByLevelId[m.mappingLevelId] ?? 0) + 1;
  }

  for (const [ploId, byCourse] of courseBreakdownByPlo) {
    const row = rows.get(ploId);
    if (row) {
      row.courses = [...byCourse.values()].sort((a, b) =>
        a.courseCode.localeCompare(b.courseCode),
      );
    }
  }

  return [...rows.values()];
}
