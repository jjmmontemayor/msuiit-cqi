'use client';

import { Fragment, useState } from 'react';
import type { PloSummaryRow } from '@/lib/mapping-summary';
import type { DisplayCodes } from '@/lib/api';

function weighted(
  counts: { I: number; P: number; D: number },
  weights: Record<'I' | 'P' | 'D', number>,
) {
  const I = counts.I * weights.I;
  const P = counts.P * weights.P;
  const D = counts.D * weights.D;
  return { I, P, D, total: I + P + D };
}

export function WeightComputationTable({
  rows,
  weights,
  displayCodes,
}: {
  rows: PloSummaryRow[];
  weights: Record<'I' | 'P' | 'D', number>;
  displayCodes: DisplayCodes;
}) {
  const [expandedPloId, setExpandedPloId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100 dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2 text-left">PLO</th>
            <th className="px-3 py-2 text-right">{displayCodes.I} (&times;{weights.I})</th>
            <th className="px-3 py-2 text-right">{displayCodes.P} (&times;{weights.P})</th>
            <th className="px-3 py-2 text-right">{displayCodes.D} (&times;{weights.D})</th>
            <th className="px-3 py-2 text-right">Weighted Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const w = weighted(row, weights);
            const expanded = expandedPloId === row.ploId;
            return (
              <Fragment key={row.ploId}>
                <tr
                  onClick={() => setExpandedPloId(expanded ? null : row.ploId)}
                  className="cursor-pointer border-t border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <td className="px-3 py-1.5 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={`text-neutral-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                      >
                        &#9656;
                      </span>
                      {row.ploCode}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums" title={`${row.I} × ${weights.I}`}>
                    {w.I}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums" title={`${row.P} × ${weights.P}`}>
                    {w.P}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums" title={`${row.D} × ${weights.D}`}>
                    {w.D}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums">{w.total}</td>
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
                              <th className="px-2 py-1 text-right font-medium">{displayCodes.I} (&times;{weights.I})</th>
                              <th className="px-2 py-1 text-right font-medium">{displayCodes.P} (&times;{weights.P})</th>
                              <th className="px-2 py-1 text-right font-medium">{displayCodes.D} (&times;{weights.D})</th>
                              <th className="px-2 py-1 text-right font-medium">Course Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.courses.map((c) => {
                              const cw = weighted(c, weights);
                              return (
                                <tr key={c.courseCode} className="border-t border-neutral-200 dark:border-neutral-800">
                                  <td className="px-2 py-1">{c.courseCode}</td>
                                  <td className="px-2 py-1 text-right tabular-nums" title={`${c.I} × ${weights.I}`}>
                                    {cw.I}
                                  </td>
                                  <td className="px-2 py-1 text-right tabular-nums" title={`${c.P} × ${weights.P}`}>
                                    {cw.P}
                                  </td>
                                  <td className="px-2 py-1 text-right tabular-nums" title={`${c.D} × ${weights.D}`}>
                                    {cw.D}
                                  </td>
                                  <td className="px-2 py-1 text-right font-medium tabular-nums">{cw.total}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-neutral-300 font-medium dark:border-neutral-700">
                              <td className="px-2 py-1">PLO Total</td>
                              <td className="px-2 py-1 text-right tabular-nums">{w.I}</td>
                              <td className="px-2 py-1 text-right tabular-nums">{w.P}</td>
                              <td className="px-2 py-1 text-right tabular-nums">{w.D}</td>
                              <td className="px-2 py-1 text-right tabular-nums">{w.total}</td>
                            </tr>
                          </tfoot>
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
