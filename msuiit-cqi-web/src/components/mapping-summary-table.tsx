'use client';

import { Fragment, useState } from 'react';
import type { PloSummaryRow } from '@/lib/mapping-summary';
import { LEVEL_TEXT_CLASSES } from '@/lib/mapping-level-colors';

type SortKey = 'I' | 'P' | 'D' | 'Total';

const SORT_KEYS: SortKey[] = ['I', 'P', 'D', 'Total'];

function totalOf(row: PloSummaryRow) {
  return row.I + row.P + row.D;
}

export function MappingSummaryTable({ rows }: { rows: PloSummaryRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedPloId, setExpandedPloId] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sortedRows = sortKey
    ? [...rows].sort((a, b) => {
        const av = sortKey === 'Total' ? totalOf(a) : a[sortKey];
        const bv = sortKey === 'Total' ? totalOf(b) : b[sortKey];
        return sortDir === 'asc' ? av - bv : bv - av;
      })
    : rows;

  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100 dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2 text-left">PLO</th>
            {SORT_KEYS.map((key) => (
              <th key={key} className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => handleSort(key)}
                  className="inline-flex items-center gap-0.5 font-medium hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  {key}
                  {sortKey === key && (
                    <span aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const expanded = expandedPloId === row.ploId;
            return (
              <Fragment key={row.ploId}>
                <tr
                  onClick={() => setExpandedPloId(expanded ? null : row.ploId)}
                  className="cursor-pointer border-t border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={`text-neutral-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                      >
                        &#9656;
                      </span>
                      <span className="font-medium">{row.ploCode}</span>
                    </div>
                    <div className="mt-0.5 pl-4 text-xs text-neutral-500 dark:text-neutral-400">
                      {row.ploDescription}
                    </div>
                  </td>
                  <td className={`px-3 py-1.5 text-right font-medium tabular-nums ${LEVEL_TEXT_CLASSES.I}`}>{row.I}</td>
                  <td className={`px-3 py-1.5 text-right font-medium tabular-nums ${LEVEL_TEXT_CLASSES.P}`}>{row.P}</td>
                  <td className={`px-3 py-1.5 text-right font-medium tabular-nums ${LEVEL_TEXT_CLASSES.D}`}>{row.D}</td>
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                    {totalOf(row)}
                  </td>
                </tr>
                {expanded && (
                  <tr className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <td colSpan={5} className="px-3 py-2 pl-8">
                      {row.courses.length === 0 ? (
                        <p className="text-xs text-neutral-500">No courses mapped to this PLO.</p>
                      ) : (
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="text-neutral-500 dark:text-neutral-400">
                              <th className="px-2 py-1 text-left font-medium">Course</th>
                              <th className="px-2 py-1 text-right font-medium">I</th>
                              <th className="px-2 py-1 text-right font-medium">P</th>
                              <th className="px-2 py-1 text-right font-medium">D</th>
                              <th className="px-2 py-1 text-right font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.courses.map((c) => (
                              <tr
                                key={c.courseCode}
                                className="border-t border-neutral-200 dark:border-neutral-800"
                              >
                                <td className="px-2 py-1">{c.courseCode}</td>
                                <td className={`px-2 py-1 text-right tabular-nums ${LEVEL_TEXT_CLASSES.I}`}>{c.I}</td>
                                <td className={`px-2 py-1 text-right tabular-nums ${LEVEL_TEXT_CLASSES.P}`}>{c.P}</td>
                                <td className={`px-2 py-1 text-right tabular-nums ${LEVEL_TEXT_CLASSES.D}`}>{c.D}</td>
                                <td className="px-2 py-1 text-right tabular-nums">
                                  {c.I + c.P + c.D}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
