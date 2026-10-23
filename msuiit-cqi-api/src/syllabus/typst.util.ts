// Helpers for writing text into Typst markup safely.

const SPECIAL = /[\#$*_`@<>[\]~/]/g;

// Escape user text for use inside Typst content (e.g. a table cell `[...]`).
export function esc(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(SPECIAL, (c) => `\${c}`)
    .replace(/\r?\n/g, ' \ ')
    .replace(/^([-+=])/, '\$1');
}

// Ordinal semester names used in the course information table.
export function semesterName(semester: 'FIRST' | 'SECOND' | 'SUMMER'): string {
  return semester === 'FIRST'
    ? 'First Semester'
    : semester === 'SECOND'
      ? 'Second Semester'
      : 'Summer';
}

// Pull the trailing number out of codes like "CLO2" / "CO2" so a learning-plan
// "CO1, CO3" label can be matched to CLO codes.
export function codeNumber(code: string): number | null {
  const m = code.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
}
