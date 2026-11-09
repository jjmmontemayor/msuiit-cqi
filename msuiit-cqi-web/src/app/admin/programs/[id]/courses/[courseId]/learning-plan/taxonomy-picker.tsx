"use client";

import { useRef, useState } from "react";

// Bloom's Taxonomy (revised), lowest to highest cognitive level.
export const BLOOM_LEVELS = [
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
];

// Pick Bloom's levels from a dropdown; chosen levels show as removable chips
// and are saved with the enclosing form as a comma-separated list.
export function TaxonomyPicker({
  name,
  defaultValue,
  className,
}: {
  name: string;
  defaultValue: string;
  className: string;
}) {
  const [levels, setLevels] = useState(
    defaultValue
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean),
  );
  const hidden = useRef<HTMLInputElement>(null);

  function commit(next: string[]) {
    setLevels(next);
    // Write the value before submitting; state hasn't re-rendered yet.
    if (hidden.current) {
      hidden.current.value = next.join(", ");
      hidden.current.form?.requestSubmit();
    }
  }

  return (
    <div>
      <input
        ref={hidden}
        type="hidden"
        name={name}
        defaultValue={levels.join(", ")}
      />
      {levels.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {levels.map((l) => (
            <span
              key={l}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-0.5 text-xs dark:border-neutral-700"
            >
              {l}
              <button
                type="button"
                title="Remove"
                aria-label={`Remove ${l}`}
                onClick={() => commit(levels.filter((x) => x !== l))}
                className="text-neutral-400 hover:text-red-600"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
      <select
        value=""
        onChange={(e) => {
          const level = e.target.value;
          if (level && !levels.includes(level)) {
            // Keep Bloom's order regardless of the order picked.
            commit(
              [...levels, level].sort(
                (a, b) => BLOOM_LEVELS.indexOf(a) - BLOOM_LEVELS.indexOf(b),
              ),
            );
          }
        }}
        className={className}
      >
        <option value="">Add Bloom&apos;s level&hellip;</option>
        {BLOOM_LEVELS.filter((l) => !levels.includes(l)).map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
