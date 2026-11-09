"use client";

import { useId, useState } from "react";

// "Week 2", "2", "2-3" and "Week 2 - Week 3" all read back as a week range.
function parse(label: string): [number, number] | null {
  const m = /^\s*(?:week\s*)?(\d+)\s*(?:[-–]\s*(?:week\s*)?(\d+))?\s*$/i.exec(
    label,
  );
  if (!m) return null;
  const from = Number(m[1]);
  const to = m[2] ? Number(m[2]) : from;
  return [from, Math.max(from, to)];
}

function format(from: number, to: number | null): string {
  return to && to > from ? `Week ${from} - Week ${to}` : `Week ${from}`;
}

// Week selection for a learning plan entry. When the course has a number of
// weeks, pick a first week and optionally a last week from it; the label is
// saved as "Week 2" or "Week 2 - Week 3". Without a week count (or for a label
// that isn't week numbers) it stays a free-text field.
export function WeekField({
  weeks,
  defaultValue,
  className,
}: {
  weeks: number | null | undefined;
  defaultValue?: string;
  className: string;
}) {
  const id = useId();
  const parsed = defaultValue ? parse(defaultValue) : null;
  const freeText = !weeks || (!!defaultValue && !parsed);

  const [from, setFrom] = useState(parsed?.[0] ?? 1);
  const [to, setTo] = useState<number | null>(
    parsed && parsed[1] > parsed[0] ? parsed[1] : null,
  );

  if (freeText) {
    return (
      <label className="text-sm">
        Week label
        <input
          name="weekLabel"
          required
          placeholder="Week 1"
          defaultValue={defaultValue}
          className={className}
        />
      </label>
    );
  }

  const max = Math.max(weeks, parsed?.[1] ?? 0);
  const options = Array.from({ length: max }, (_, i) => i + 1);

  function changeFrom(next: number) {
    setFrom(next);
    if (to !== null && to <= next) setTo(null);
  }

  return (
    <div className="text-sm">
      <span id={id}>Week</span>
      <input type="hidden" name="weekLabel" value={format(from, to)} />
      <div className="mt-1 flex items-center gap-1.5">
        <select
          aria-labelledby={id}
          value={from}
          onChange={(e) => changeFrom(Number(e.target.value))}
          className={className}
        >
          {options.map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
        <span className="text-neutral-400">&ndash;</span>
        <select
          aria-label="Last week (optional)"
          value={to ?? ""}
          onChange={(e) =>
            setTo(e.target.value ? Number(e.target.value) : null)
          }
          className={className}
        >
          <option value="">&mdash;</option>
          {options
            .filter((w) => w > from)
            .map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
