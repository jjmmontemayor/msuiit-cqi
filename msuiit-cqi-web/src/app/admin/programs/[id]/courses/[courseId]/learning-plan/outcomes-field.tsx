"use client";

import { useId, useState } from "react";

// One input per lesson learning outcome; saved with the form as a single
// newline-separated value so a week can carry several outcomes.
export function OutcomesField({
  className,
  defaultValue = "",
}: {
  className: string;
  defaultValue?: string;
}) {
  const baseId = useId();
  const [outcomes, setOutcomes] = useState(() => {
    const lines = defaultValue.split("\n").filter((l) => l.trim());
    return lines.length > 0 ? lines : [""];
  });

  function update(i: number, value: string) {
    setOutcomes(outcomes.map((o, j) => (j === i ? value : o)));
  }

  function remove(i: number) {
    setOutcomes(outcomes.length === 1 ? [""] : outcomes.filter((_, j) => j !== i));
  }

  return (
    <div className="text-sm sm:col-span-2">
      <label htmlFor={`${baseId}-0`}>Lesson learning outcomes</label>
      <input
        type="hidden"
        name="lessonOutcome"
        value={outcomes.map((o) => o.trim()).filter(Boolean).join("\n")}
      />
      <div className="mt-1 space-y-1.5">
        {outcomes.map((outcome, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              id={`${baseId}-${i}`}
              value={outcome}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`Outcome ${i + 1}`}
              className={className}
            />
            {outcomes.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove outcome ${i + 1}`}
                className="rounded-md px-2 text-neutral-500 hover:text-red-600"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOutcomes([...outcomes, ""])}
        className="mt-1.5 text-xs font-medium text-neutral-600 hover:underline dark:text-neutral-400"
      >
        + Add another outcome
      </button>
    </div>
  );
}
