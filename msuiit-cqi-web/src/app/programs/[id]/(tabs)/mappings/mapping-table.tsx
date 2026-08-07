'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MappingCell } from '../../../../admin/programs/[id]/mappings/mapping-cell';
import { CloTextCell } from './clo-text-cell';
import { LEVEL_BADGE_CLASSES } from '@/lib/mapping-level-colors';
import type { Clo, CloPloMapping, Course, Plo } from '@/lib/api';

type CourseWithClos = Course & { clos: Clo[] };

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.796 2.796 6.79-6.882a1 1 0 0 1 1.414-.02Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function MappingTable({
  programId,
  cohortId,
  courses,
  plos,
  mappings,
}: {
  programId: string;
  cohortId: string;
  courses: CourseWithClos[];
  plos: Plo[];
  mappings: CloPloMapping[];
}) {
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const levelByCloAndPlo = new Map<string, CloPloMapping>();
  for (const m of mappings) {
    levelByCloAndPlo.set(`${m.cloId}::${m.ploId}`, m);
  }

  return (
    <table className="min-w-full border-collapse text-sm">
      <thead className="sticky top-0 z-20 bg-neutral-100 dark:bg-neutral-900">
        <tr>
          <th className="sticky left-0 z-30 bg-neutral-100 px-3 py-2 text-left dark:bg-neutral-900">
            Course
          </th>
          <th className="sticky left-[9rem] z-30 bg-neutral-100 px-3 py-2 text-left dark:bg-neutral-900">
            CLO
          </th>
          {plos.map((plo) => (
            <th key={plo.id} className="px-3 py-2 text-center" title={plo.description}>
              {plo.code}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {courses.map((course) => {
          const isEditing = editingCourseId === course.id;
          return course.clos.map((clo, cloIdx) => (
            <tr key={clo.id} className="border-t border-neutral-200 dark:border-neutral-800">
              {cloIdx === 0 && (
                <td
                  rowSpan={course.clos.length}
                  className="sticky left-0 z-10 w-36 whitespace-nowrap bg-white px-3 py-1.5 align-top font-medium dark:bg-neutral-950"
                >
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/programs/${programId}/courses/${course.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {course.code}
                    </Link>
                    {course.clos.length > 0 && (
                      <button
                        type="button"
                        title={isEditing ? 'Done editing' : 'Edit mapping'}
                        aria-label={isEditing ? 'Done editing' : 'Edit mapping'}
                        onClick={() => setEditingCourseId(isEditing ? null : course.id)}
                        className={`shrink-0 rounded p-0.5 ${
                          isEditing
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                        }`}
                      >
                        {isEditing ? <CheckIcon /> : <PencilIcon />}
                      </button>
                    )}
                  </div>
                </td>
              )}
              <td className="sticky left-[9rem] z-10 w-64 bg-white px-3 py-1.5 align-top dark:bg-neutral-950">
                {isEditing ? (
                  <CloTextCell programId={programId} courseId={course.id} clo={clo} />
                ) : (
                  <>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">
                      {clo.code}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {clo.description}
                    </div>
                  </>
                )}
              </td>
              {plos.map((plo) => {
                const mapping = levelByCloAndPlo.get(`${clo.id}::${plo.id}`);
                return (
                  <td key={plo.id} className="px-3 py-1.5 text-center">
                    {isEditing ? (
                      <MappingCell
                        programId={programId}
                        cohortId={cohortId}
                        cloId={clo.id}
                        ploId={plo.id}
                        initialLevel={mapping?.levelCode ?? ''}
                      />
                    ) : mapping ? (
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${LEVEL_BADGE_CLASSES[mapping.levelCode]}`}
                        title={mapping.assessmentMethod ?? undefined}
                      >
                        {mapping.levelCode}
                      </span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ));
        })}
      </tbody>
    </table>
  );
}
