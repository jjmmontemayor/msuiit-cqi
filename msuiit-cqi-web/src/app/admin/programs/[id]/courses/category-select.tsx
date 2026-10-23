"use client";

import type { CourseCategory } from "@/lib/api";

const CATEGORY_LABELS: Record<CourseCategory, string> = {
  MAJOR: "Major",
  MINOR: "Minor",
  ELECTIVE: "Elective",
};

// Saves as soon as a category is picked; choosing the empty option resets it.
export function CategorySelect({
  action,
  value,
  emptyLabel,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  value: CourseCategory | null;
  emptyLabel: string;
  label: string;
}) {
  return (
    <form action={action} className="shrink-0 pr-4">
      <select
        name="category"
        defaultValue={value ?? ""}
        aria-label={label}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border border-neutral-300 px-1.5 py-0.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="">{emptyLabel}</option>
        {(Object.keys(CATEGORY_LABELS) as CourseCategory[]).map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
    </form>
  );
}
