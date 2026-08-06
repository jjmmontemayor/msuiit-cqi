import type { Clo, CloPloMapping, Course, Plo } from './api';

type CourseWithClos = Course & { clos: Clo[] };

export interface CourseBreakdown {
  courseCode: string;
  I: number;
  P: number;
  D: number;
}

export interface PloSummaryRow {
  ploId: string;
  ploCode: string;
  ploDescription: string;
  I: number;
  P: number;
  D: number;
  courses: CourseBreakdown[];
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
      I: 0,
      P: 0,
      D: 0,
      courses: [],
    });
  }

  const courseBreakdownByPlo = new Map<string, Map<string, CourseBreakdown>>();

  for (const m of mappings) {
    const row = rows.get(m.ploId);
    if (!row) continue;
    row[m.levelCode] += 1;

    const courseCode = courseCodeByCloId.get(m.cloId);
    if (!courseCode) continue;

    let byCourse = courseBreakdownByPlo.get(m.ploId);
    if (!byCourse) {
      byCourse = new Map();
      courseBreakdownByPlo.set(m.ploId, byCourse);
    }
    let entry = byCourse.get(courseCode);
    if (!entry) {
      entry = { courseCode, I: 0, P: 0, D: 0 };
      byCourse.set(courseCode, entry);
    }
    entry[m.levelCode] += 1;
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
