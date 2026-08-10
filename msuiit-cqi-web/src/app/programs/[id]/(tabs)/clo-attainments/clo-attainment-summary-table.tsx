'use client';

import { useState } from 'react';
import type { CloAttainmentByCourseRow } from '@/lib/api';

type SortKey = 'attainment' | 'status';

export function CloAttainmentSummaryTable({
  rows,
  benchmarkPercentage,
}: {
  rows: CloAttainmentByCourseRow[];
  benchmarkPercentage: number;
}) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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
        const av = Number(a.avg_score);
        const bv = Number(b.avg_score);
        if (sortKey === 'attainment') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        // status: sort "Action Required" (below benchmark) together
        const aMet = av >= benchmarkPercentage ? 1 : 0;
        const bMet = bv >= benchmarkPercentage ? 1 : 0;
        return sortDir === 'asc' ? aMet - bMet : bMet - aMet;
      })
    : rows;

  return (
    <table className="min-w-full text-sm">
      <thead className="bg-neutral-100 dark:bg-neutral-900">
        <tr>
          <th className="px-3 py-2 text-left">Course</th>
          <th className="px-3 py-2 text-left">CLO</th>
          <th className="px-3 py-2 text-right">
            <button
              type="button"
              onClick={() => handleSort('attainment')}
              className="inline-flex items-center gap-0.5 font-medium hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              CLO Attainment
              {sortKey === 'attainment' && (
                <span aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          </th>
          <th className="px-3 py-2 text-center">
            <button
              type="button"
              onClick={() => handleSort('status')}
              className="inline-flex items-center gap-0.5 font-medium hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Status
              {sortKey === 'status' && (
                <span aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => {
          const avg = Number(row.avg_score);
          const met = avg >= benchmarkPercentage;
          return (
            <tr
              key={row.clo_id}
              className="border-t border-neutral-200 dark:border-neutral-800"
            >
              <td className="px-3 py-1.5">{row.course_code}</td>
              <td className="px-3 py-1.5">{row.clo_code}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{avg.toFixed(1)}%</td>
              <td className="px-3 py-1.5 text-center">
                {met ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✅ Target Met
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    ❌ Action Required
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
