"use client";

import { useState } from "react";

const select =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900";

// Start / end year dropdowns for a new cohort. The cohort code is generated
// from them ("2022-2026") and sent along as a hidden field.
export function CohortYearFields() {
  const thisYear = new Date().getFullYear();
  const [start, setStart] = useState(thisYear);
  const [end, setEnd] = useState(thisYear + 4);

  const startYears = Array.from({ length: 16 }, (_, i) => thisYear - 12 + i);
  const endYears = Array.from({ length: 9 }, (_, i) => start + i);
  const code = `${start}-${end}`;

  function changeStart(next: number) {
    setStart(next);
    // Keep the end year valid; a 4-year program is the usual case.
    if (end <= next || end > next + 8) setEnd(next + 4);
  }

  return (
    <>
      <label className="text-sm">
        Start year
        <select
          name="startYear"
          value={start}
          onChange={(e) => changeStart(Number(e.target.value))}
          className={select}
        >
          {startYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        End year
        <select
          name="endYear"
          value={end}
          onChange={(e) => setEnd(Number(e.target.value))}
          className={select}
        >
          {endYears
            .filter((y) => y > start)
            .map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
        </select>
      </label>
      <div className="text-sm">
        Code
        <div className="mt-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          {code}
        </div>
        <input type="hidden" name="code" value={code} />
      </div>
    </>
  );
}
