'use client';

import { useState, useTransition } from 'react';
import { deleteLearningPlanEntry, reorderLearningPlanEntries } from '../../../../../actions';
import type { LearningPlanEntry } from '@/lib/api';

export function LearningPlanTable({
  programId,
  courseId,
  entries,
}: {
  programId: string;
  courseId: string;
  entries: LearningPlanEntry[];
}) {
  const [rows, setRows] = useState(entries);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...rows];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setRows(next);
    setDragIndex(null);
    startTransition(async () => {
      await reorderLearningPlanEntries(
        programId,
        courseId,
        next.map((e) => e.id),
      );
    });
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100 dark:bg-neutral-900">
          <tr>
            <th className="w-6 px-2 py-2" />
            <th className="px-3 py-2 text-left">Week</th>
            <th className="px-3 py-2 text-left">Topics</th>
            <th className="px-3 py-2 text-left">Lesson Outcome</th>
            <th className="px-3 py-2 text-left">CLO</th>
            <th className="px-3 py-2 text-left">Methodology</th>
            <th className="px-3 py-2 text-left">Resources</th>
            <th className="px-3 py-2 text-left">Assessment</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className={isPending ? 'opacity-50' : undefined}>
          {rows.map((entry, i) => (
            <tr
              key={entry.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className={`border-t border-neutral-200 align-top dark:border-neutral-800 ${
                dragIndex === i ? 'opacity-40' : ''
              }`}
            >
              <td className="cursor-grab px-2 py-2 text-center text-neutral-400 active:cursor-grabbing">
                &#8942;&#8942;
              </td>
              <td className="whitespace-nowrap px-3 py-2 font-medium">{entry.weekLabel}</td>
              <td className="px-3 py-2">{entry.topics}</td>
              <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                {entry.lessonOutcome}
              </td>
              <td className="px-3 py-2">{entry.coLabels}</td>
              <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                {entry.methodology}
              </td>
              <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                {entry.learningResources}
              </td>
              <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                {entry.assessment}
              </td>
              <td className="px-3 py-2">
                <form action={deleteLearningPlanEntry.bind(null, programId, courseId, entry.id)}>
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
