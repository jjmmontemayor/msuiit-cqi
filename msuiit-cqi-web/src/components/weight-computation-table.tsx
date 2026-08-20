'use client';

import { Fragment, useState } from 'react';
import type { PloSummaryRow } from '@/lib/mapping-summary';
import type { MappingLevel } from '@/lib/api';

function weightedByLevel(countsByLevelId: Record<string, number>, mappingLevels: MappingLevel[]) {
  const weighted: Record<string, number> = {};
  let total = 0;
  for (const level of mappingLevels) {
    const w = (countsByLevelId[level.id] ?? 0) * level.weight;
    weighted[level.id] = w;
    total += w;
  }
  return { weighted, total };
}

export function WeightComputationTable({
  rows,
  mappingLevels,
}: {
  rows: PloSummaryRow[];
  mappingLevels: MappingLevel[];
}) {
  const [expandedPloId, setExpandedPloId] = useState<string | null>(null);
  const colSpan = mappingLevels.length + 2;

  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100 dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2 text-left">PLO</th>
            {mappingLevels.map((level) => (
              <th key={level.id} className="px-3 py-2 text-right">
                {level.displayCode} (&times;{level.weight})
              </th>
            ))}
            <th className="px-3 py-2 text-right">Weighted Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { weighted, total } = weightedByLevel(row.countsByLevelId, mappingLevels);
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
                  {mappingLevels.map((level) => (
                    <td
                      key={level.id}
                      className="px-3 py-1.5 text-right tabular-nums"
                      title={`${row.countsByLevelId[level.id] ?? 0} × ${level.weight}`}
                    >
                      {weighted[level.id]}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums">{total}</td>
                </tr>
                {expanded && (
                  <tr className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <td colSpan={colSpan} className="px-3 py-2 pl-8">
                      {row.courses.length === 0 ? (
                        <p className="text-xs text-neutral-500">No courses mapped to this PLO.</p>
                      ) : (
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="text-neutral-500 dark:text-neutral-400">
                              <th className="px-2 py-1 text-left font-medium">Course</th>
                              {mappingLevels.map((level) => (
                                <th key={level.id} className="px-2 py-1 text-right font-medium">
                                  {level.displayCode} (&times;{level.weight})
                                </th>
                              ))}
                              <th className="px-2 py-1 text-right font-medium">Course Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.courses.map((c) => {
                              const cw = weightedByLevel(c.countsByLevelId, mappingLevels);
                              return (
                                <tr
                                  key={c.courseCode}
                                  className="border-t border-neutral-200 dark:border-neutral-800"
                                >
                                  <td className="px-2 py-1">{c.courseCode}</td>
                                  {mappingLevels.map((level) => (
                                    <td
                                      key={level.id}
                                      className="px-2 py-1 text-right tabular-nums"
                                      title={`${c.countsByLevelId[level.id] ?? 0} × ${level.weight}`}
                                    >
                                      {cw.weighted[level.id]}
                                    </td>
                                  ))}
                                  <td className="px-2 py-1 text-right font-medium tabular-nums">
                                    {cw.total}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-neutral-300 font-medium dark:border-neutral-700">
                              <td className="px-2 py-1">PLO Total</td>
                              {mappingLevels.map((level) => (
                                <td key={level.id} className="px-2 py-1 text-right tabular-nums">
                                  {weighted[level.id]}
                                </td>
                              ))}
                              <td className="px-2 py-1 text-right tabular-nums">{total}</td>
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
