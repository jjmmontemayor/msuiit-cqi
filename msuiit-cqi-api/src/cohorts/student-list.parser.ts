import * as XLSX from 'xlsx';

export interface ParsedStudent {
  studentNumber: string;
  firstName: string;
  lastName: string;
}

export interface ParsedStudentList {
  students: ParsedStudent[];
  // Rows that had something in them but no usable student number or name.
  invalidRows: number;
}

// A specific "Student Number / No. / ID" header wins over a bare row-count "No.".
const NUMBER_HEADER = /student\s*(no\.?|number|id)|^id(\s*(no\.?|number))?$/i;
const ROW_NO_HEADER = /^no\.?$/i;
const LAST_HEADER = /last\s*name|surname|family\s*name/i;
const FIRST_HEADER = /first\s*name|given\s*name/i;
const NAME_HEADER = /^(student\s*|full\s*)?name$/i;
// 2024-0013 style numbers, used when the sheet has no header row.
const NUMBER_VALUE = /^\d{4}-\d{3,6}$/;

const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();

// "AZUR, Kurt Renzo H." -> last "AZUR", first "Kurt Renzo H."; without a
// comma the last word is taken as the surname.
function splitName(full: string): { firstName: string; lastName: string } | null {
  const name = clean(full);
  if (!name) return null;
  const comma = name.indexOf(',');
  if (comma > 0) {
    const lastName = clean(name.slice(0, comma));
    const firstName = clean(name.slice(comma + 1));
    return lastName && firstName ? { firstName, lastName } : null;
  }
  const parts = name.split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

interface Columns {
  number: number;
  name?: number;
  first?: number;
  last?: number;
}

function findHeader(rows: string[][]): { index: number; cols: Columns } | null {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const cells = rows[i].map(clean);
    let number = cells.findIndex((c) => NUMBER_HEADER.test(c));
    if (number === -1) number = cells.findIndex((c) => ROW_NO_HEADER.test(c));
    if (number === -1) continue;
    const last = cells.findIndex((c) => LAST_HEADER.test(c));
    const first = cells.findIndex((c) => FIRST_HEADER.test(c));
    const name = cells.findIndex((c) => NAME_HEADER.test(c));
    if ((last !== -1 && first !== -1) || name !== -1) {
      return {
        index: i,
        cols: {
          number,
          name: name === -1 ? undefined : name,
          first: first === -1 ? undefined : first,
          last: last === -1 ? undefined : last,
        },
      };
    }
  }
  return null;
}

export function parseStudentList(buffer: Buffer): ParsedStudentList {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { students: [], invalidRows: 0 };

  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  const header = findHeader(rows);
  const students: ParsedStudent[] = [];
  const seen = new Set<string>();
  let invalidRows = 0;

  const add = (studentNumber: string, names: { firstName: string; lastName: string } | null) => {
    if (!studentNumber || !names || studentNumber.length > 20) {
      invalidRows++;
      return;
    }
    if (seen.has(studentNumber)) return;
    seen.add(studentNumber);
    students.push({ studentNumber, ...names });
  };

  for (let i = header ? header.index + 1 : 0; i < rows.length; i++) {
    const cells = rows[i].map(clean);
    if (cells.every((c) => !c)) continue;

    if (header) {
      const { cols } = header;
      const names =
        cols.last !== undefined && cols.first !== undefined
          ? cells[cols.last] && cells[cols.first]
            ? { firstName: cells[cols.first], lastName: cells[cols.last] }
            : null
          : splitName(cells[cols.name ?? -1] ?? '');
      add(cells[cols.number] ?? '', names);
    } else {
      // No header: a row counts if some cell looks like a student number;
      // the name is the first other cell with letters in it.
      const numberIdx = cells.findIndex((c) => NUMBER_VALUE.test(c));
      if (numberIdx === -1) continue;
      const nameCell = cells.find(
        (c, idx) => idx !== numberIdx && c.length > 2 && /[A-Za-z]/.test(c),
      );
      add(cells[numberIdx], splitName(nameCell ?? ''));
    }
  }

  return { students, invalidRows };
}
