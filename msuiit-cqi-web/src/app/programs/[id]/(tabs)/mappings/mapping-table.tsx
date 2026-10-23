'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MappingCell } from '../../../../admin/programs/[id]/mappings/mapping-cell';
import { CheckIcon, PencilIcon } from '@/components/icon-buttons';
import { CloTextCell } from './clo-text-cell';
import { ClampableText } from '@/components/clampable-text';
import type { LevelColorsById } from '@/lib/mapping-level-colors';
import { buildLevelsById, type Clo, type CloPloMapping, type Course, type MappingLevel, type Plo } from '@/lib/api';

type CourseWithClos = Course & { clos: Clo[] };

export function MappingTable({
  programId,
  programCode,
  curriculumVersionId,
  courses,
  plos,
  mappings,
  ploAssessmentCourseIds,
  mappingLevels,
  levelColors,
  editable = false,
}: {
  programId: string;
  programCode: string;
  curriculumVersionId: string;
  courses: CourseWithClos[];
  plos: Plo[];
  mappings: CloPloMapping[];
  ploAssessmentCourseIds: string[];
  mappingLevels: MappingLevel[];
  levelColors: LevelColorsById;
  // Admin only: shows a pencil per course to edit its CLO text and mapping cells.
  editable?: boolean;
}) {
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const levelsById = buildLevelsById(mappingLevels);

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
          const isEditing = editable && editingCourseId === course.id;
          return course.clos.map((clo, cloIdx) => (
            <tr key={clo.id} className="border-t border-neutral-200 dark:border-neutral-800">
              {cloIdx === 0 && (
                <td
                  rowSpan={course.clos.length}
                  title={
                    ploAssessmentCourseIds.includes(course.id)
                      ? 'Designated for formal PLO assessment'
                      : undefined
                  }
                  className={`sticky left-0 z-10 w-36 whitespace-nowrap px-3 py-1.5 align-top font-medium ${
                    ploAssessmentCourseIds.includes(course.id)
                      ? 'bg-emerald-50 dark:bg-emerald-950/40'
                      : 'bg-white dark:bg-neutral-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/programs/${programCode}/courses/${course.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      <div>{course.code}</div>
                      <div className="whitespace-normal text-xs font-normal text-neutral-500 dark:text-neutral-400">
                        {course.title}
                      </div>
                    </Link>
                    {editable && course.clos.length > 0 && (
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
                    <ClampableText
                      text={clo.description}
                      className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400"
                    />
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
                        curriculumVersionId={curriculumVersionId}
                        cloId={clo.id}
                        ploId={plo.id}
                        initialMappingLevelId={mapping?.mappingLevelId ?? ''}
                        mappingLevels={mappingLevels}
                        levelColors={levelColors}
                      />
                    ) : mapping ? (
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${levelColors[mapping.mappingLevelId]?.badge ?? ''}`}
                      >
                        {levelsById[mapping.mappingLevelId]?.displayCode}
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
