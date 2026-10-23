"use client";

import { useTransition } from "react";
import {
  addEntryAssessment,
  deleteAssessmentTask,
  setAssessmentIncluded,
} from "../../../../../actions";
import type { AssessmentTask } from "@/lib/api";
import { ASSESSMENT_TYPES } from "./presets";

// Assessments of one learning plan week: bordered chips (remove with x, tick
// to count the assessment toward CLO computation) plus a dropdown to add more.
export function EntryAssessments({
  programId,
  courseId,
  offeringId,
  entryId,
  tasks,
}: {
  programId: string;
  courseId: string;
  offeringId: string;
  entryId: string;
  tasks: AssessmentTask[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className={isPending ? "opacity-50" : undefined}>
      <div className="flex flex-wrap gap-1">
        {tasks.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-0.5 text-xs dark:border-neutral-700"
          >
            <input
              type="checkbox"
              checked={t.included}
              title="Include in CLO computation"
              aria-label={`Include ${t.name} in CLO computation`}
              onChange={(e) =>
                startTransition(() =>
                  setAssessmentIncluded(
                    programId,
                    courseId,
                    t.id,
                    e.target.checked,
                  ),
                )
              }
            />
            <span className={t.included ? undefined : "text-neutral-500"}>
              {t.name}
            </span>
            <button
              type="button"
              title="Remove"
              aria-label={`Remove ${t.name}`}
              onClick={() =>
                startTransition(() =>
                  deleteAssessmentTask(programId, courseId, t.id),
                )
              }
              className="text-neutral-400 hover:text-red-600"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <select
        value=""
        onChange={(e) => {
          const type = e.target.value;
          if (!type) return;
          const numbered =
            ASSESSMENT_TYPES.find(([n]) => n === type)?.[1] ?? false;
          startTransition(() =>
            addEntryAssessment(
              programId,
              courseId,
              offeringId,
              entryId,
              type,
              numbered,
            ),
          );
        }}
        className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="">Add assessment&hellip;</option>
        {ASSESSMENT_TYPES.map(([name]) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
