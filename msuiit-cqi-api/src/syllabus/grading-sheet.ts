import * as XLSX from 'xlsx';
import type { SyllabusData } from './syllabus.types';

export interface SheetStudent {
  studentNumber: string;
  name: string;
}

const BLANK_ROWS = 40;

// Excel rows (1-based) of the weight and max-score lines in the header block.
const R_WEIGHT = 6;
const R_MAX = 7;

function colName(index: number): string {
  return XLSX.utils.encode_col(index);
}

function orderedTasks(d: SyllabusData) {
  return d.clos.flatMap((clo) =>
    d.tasks
      .filter((t) => t.included && t.cloId === clo.id)
      .map((task) => ({ clo, task })),
  );
}

// Recorded but not counted toward any CLO: shown as plain columns at the end.
function uncountedTasks(d: SyllabusData) {
  return d.tasks.filter((t) => !t.included || !t.cloId);
}

function termLine(d: SyllabusData): string {
  const sem =
    d.term.semester === 'FIRST'
      ? '1st Semester'
      : d.term.semester === 'SECOND'
        ? '2nd Semester'
        : 'Summer';
  return (
    `A.Y. ${d.term.schoolYearStart}-${d.term.schoolYearEnd}, ${sem}` +
    (d.offering.section ? `   Section: ${d.offering.section}` : '') +
    (d.offering.instructorName
      ? `   Instructor: ${d.offering.instructorName}`
      : '')
  );
}

function studentRows(students: SheetStudent[]): SheetStudent[] {
  return students.length > 0
    ? students
    : Array.from({ length: BLANK_ROWS }, () => ({
        studentNumber: '',
        name: '',
      }));
}

// One workbook per offering: students down, the assessment tasks selected for
// each CLO across, then formulas for each CLO score, the weighted overall score
// and the equivalent grade (scale on the "Grade Scale" sheet).
export function buildGradingSheetXlsx(
  d: SyllabusData,
  students: SheetStudent[],
): Buffer {
  const ordered = orderedTasks(d);
  const extras = uncountedTasks(d);
  const taskStart = 2; // columns A, B = student number, name
  const cloCount = d.clos.length;
  const cloResultStart = taskStart + ordered.length;
  const overallCol = cloResultStart + cloCount;
  const gradeCol = overallCol + 1;
  const remarksCol = overallCol + 2;

  type Cell = string | number;
  const cloRow: Cell[] = ['', 'CLO'];
  const taskRow: Cell[] = ['', 'Assessment task'];
  const weightRow: Cell[] = ['', 'Weight within CLO (%)'];
  const maxRow: Cell[] = ['', 'Max score'];
  for (const { clo, task } of ordered) {
    cloRow.push(clo.code);
    taskRow.push(task.name);
    weightRow.push(task.weight);
    maxRow.push(task.maxScore);
  }
  // CLO result columns: the weight row carries each CLO's share of the overall score.
  for (const c of d.clos) {
    cloRow.push('');
    taskRow.push(`${c.code} score (%)`);
    weightRow.push(c.weight);
    maxRow.push('');
  }
  cloRow.push('', '', '');
  taskRow.push('Overall (%)', 'Equivalent grade', 'Remarks');
  weightRow.push('', '', '');
  maxRow.push('', '', '');
  for (const t of extras) {
    cloRow.push('Not counted');
    taskRow.push(t.name);
    weightRow.push('');
    maxRow.push(t.maxScore);
  }

  const aoa: Cell[][] = [
    [`${d.course.code} — ${d.course.title}`],
    [termLine(d)],
    [],
    cloRow,
    taskRow,
    weightRow,
    maxRow,
    ['Student ID Number', 'Student Name'],
  ];
  const rows = studentRows(students);
  const firstStudentRow = aoa.length; // 0-based
  for (const s of rows) aoa.push([s.studentNumber, s.name]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const cloWeightRange = `${colName(cloResultStart)}$${R_WEIGHT}:${colName(cloResultStart + Math.max(cloCount, 1) - 1)}$${R_WEIGHT}`;

  rows.forEach((_, i) => {
    const r = firstStudentRow + i + 1;
    d.clos.forEach((c, k) => {
      const idxs = ordered
        .map((o, j) => (o.clo.id === c.id ? taskStart + j : -1))
        .filter((j) => j >= 0);
      if (idxs.length === 0) return;
      const a = colName(idxs[0]);
      const b = colName(idxs[idxs.length - 1]);
      ws[`${colName(cloResultStart + k)}${r}`] = {
        t: 's',
        v: '',
        f: `IF(COUNT(${a}${r}:${b}${r})=0,"",SUMPRODUCT(${a}${r}:${b}${r}/${a}$${R_MAX}:${b}$${R_MAX},${a}$${R_WEIGHT}:${b}$${R_WEIGHT}))`,
      };
    });
    if (cloCount === 0) return;
    const first = colName(cloResultStart);
    const last = colName(cloResultStart + cloCount - 1);
    const overall = `${colName(overallCol)}${r}`;
    ws[overall] = {
      t: 's',
      v: '',
      f: `IF(COUNT(${first}${r}:${last}${r})=0,"",SUMPRODUCT(${first}${r}:${last}${r},${cloWeightRange})/SUM(${cloWeightRange}))`,
    };
    ws[`${colName(gradeCol)}${r}`] = {
      t: 's',
      v: '',
      f: `IF(${overall}="","",LOOKUP(${overall},'Grade Scale'!$A$2:$A${d.gradeScale.length + 1},'Grade Scale'!$C$2:$C${d.gradeScale.length + 1}))`,
    };
    ws[`${colName(remarksCol)}${r}`] = {
      t: 's',
      v: '',
      f: `IF(${overall}="","",IF(${overall}>=60,"Passed","Failed"))`,
    };
  });

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: firstStudentRow + rows.length - 1, c: remarksCol + extras.length },
  });
  ws['!cols'] = [
    { wch: 18 },
    { wch: 30 },
    ...Array.from({ length: ordered.length + cloCount + 3 + extras.length }, () => ({
      wch: 14,
    })),
  ];

  // Ascending minimums so the sheet's LOOKUP can find the grade.
  const scale = XLSX.utils.aoa_to_sheet([
    ['Minimum rate (%)', 'Range', 'Equivalent grade'],
    ...[...d.gradeScale]
      .sort((a, b) => a.min - b.min)
      .map((r) => [
        r.min,
        r.min === 0 ? `below ${r.max}` : `${r.min} - ${r.max}`,
        Number(r.grade),
      ]),
  ]);
  scale['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 18 }];

  const wb = XLSX.utils.book_new();
  // Formula cells carry empty cached values; have Excel recalculate on open.
  wb.Workbook = { CalcPr: { fullCalcOnLoad: true } } as XLSX.WorkBook['Workbook'];
  XLSX.utils.book_append_sheet(wb, ws, 'Grading Sheet');
  XLSX.utils.book_append_sheet(wb, scale, 'Grade Scale');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// Same layout as the workbook, values only (no formulas).
export function buildGradingSheetCsv(
  d: SyllabusData,
  students: SheetStudent[],
): string {
  const ordered = orderedTasks(d);
  const extras = uncountedTasks(d);
  const csv = (s: string | number) => {
    const v = String(s);
    return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const line = (cells: (string | number)[]) => cells.map(csv).join(',');
  const lines = [
    line([`${d.course.code} — ${d.course.title}`]),
    line([termLine(d)]),
    line(['', 'CLO', ...ordered.map((o) => o.clo.code), ...extras.map(() => 'Not counted')]),
    line(['', 'Assessment task', ...ordered.map((o) => o.task.name), ...extras.map((t) => t.name)]),
    line(['', 'Weight within CLO (%)', ...ordered.map((o) => o.task.weight), ...extras.map(() => '')]),
    line(['', 'Max score', ...ordered.map((o) => o.task.maxScore), ...extras.map((t) => t.maxScore)]),
    line([
      '',
      'CLO weight in overall (%)',
      ...d.clos.map((c) => `${c.code}=${c.weight}`),
    ]),
    line(['Student ID Number', 'Student Name', ...ordered.map((o) => o.task.name), ...extras.map((t) => t.name)]),
  ];
  for (const s of studentRows(students)) {
    lines.push(line([s.studentNumber, s.name]));
  }
  return lines.join('\r\n');
}
