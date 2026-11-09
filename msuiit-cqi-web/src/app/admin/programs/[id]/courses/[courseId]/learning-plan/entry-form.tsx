"use client";

import type { Clo, LearningPlanEntry } from "@/lib/api";
import { MethodologyField, ResourcesField } from "./methodology-field";
import { OutcomesField } from "./outcomes-field";
import { WeekField } from "./week-field";

const field =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900";

// Shared by "Add week entry" and the inline editor: pass `entry` to prefill.
export function EntryForm({
  action,
  clos,
  weeks,
  entry,
  title,
  submitLabel,
  onDone,
  className = "",
}: {
  action: (formData: FormData) => void | Promise<void>;
  clos: Clo[];
  weeks?: number | null;
  entry?: LearningPlanEntry;
  title: string;
  submitLabel: string;
  onDone?: () => void;
  className?: string;
}) {
  const selectedClos = new Set(
    (entry?.coLabels ?? "")
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean),
  );

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone?.();
      }}
      className={`grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800 ${className}`}
    >
      <h3 className="text-sm font-medium sm:col-span-4">{title}</h3>
      <WeekField
        weeks={weeks}
        defaultValue={entry?.weekLabel}
        className={field.replace("mt-1 ", "")}
      />
      <label className="text-sm sm:col-span-3">
        Topics
        <input
          name="topics"
          required
          defaultValue={entry?.topics}
          className={field}
        />
      </label>
      <OutcomesField
        className={field.replace("mt-1 ", "")}
        defaultValue={entry?.lessonOutcome ?? ""}
      />
      <fieldset className="text-sm sm:col-span-2">
        <legend>CLO(s)</legend>
        {clos.length === 0 ? (
          <p className="mt-1 text-xs text-neutral-500">
            No CLOs defined yet for this course.
          </p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700">
            {clos.map((clo) => (
              <label key={clo.id} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  name="cloLabels"
                  value={clo.code}
                  defaultChecked={selectedClos.has(clo.code)}
                  className="rounded border-neutral-300 dark:border-neutral-700"
                />
                {clo.code}
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <MethodologyField
        className={field}
        defaultValue={entry?.methodology ?? ""}
      />
      <ResourcesField
        className={field}
        defaultValue={entry?.learningResources ?? ""}
      />
      <div className="flex gap-2 sm:col-span-4">
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {submitLabel}
        </button>
        {entry && onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-md border border-neutral-300 px-4 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
