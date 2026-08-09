'use client';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function csvEscape(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const BLANK_ROWS = 30;

export function DownloadAttainmentTemplate({
  courseCode,
  clos,
}: {
  courseCode: string;
  clos: { code: string; description: string }[];
}) {
  const header = ['Student ID Number', 'Student Name', ...clos.map((c) => c.code)];

  function handleCsv() {
    const rows: string[][] = [header];
    if (clos.length > 0) {
      rows.push([]);
      rows.push(['Legend']);
      for (const c of clos) rows.push([c.code, c.description]);
    }
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
    downloadBlob(
      csv,
      'text/csv;charset=utf-8',
      `${courseCode}-attainment-template.csv`,
    );
  }

  function handleXls() {
    const headerCells = header.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
    const blankRows = Array.from({ length: BLANK_ROWS })
      .map(() => `<tr>${header.map(() => '<td></td>').join('')}</tr>`)
      .join('');
    const legendTable =
      clos.length > 0
        ? `<br/><table border="1"><tr><th colspan="2">Legend</th></tr>${clos
            .map(
              (c) =>
                `<tr><td>${escapeHtml(c.code)}</td><td>${escapeHtml(c.description)}</td></tr>`,
            )
            .join('')}</table>`
        : '';
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Attainment</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table border="1">
<tr>${headerCells}</tr>
${blankRows}
</table>
${legendTable}
</body>
</html>`;
    downloadBlob(
      html,
      'application/vnd.ms-excel;charset=utf-8',
      `${courseCode}-attainment-template.xls`,
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleCsv}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
      >
        Download CSV template
      </button>
      <button
        type="button"
        onClick={handleXls}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
      >
        Download XLS template
      </button>
    </div>
  );
}
