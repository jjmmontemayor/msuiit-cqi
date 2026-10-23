"use client";

import { useState } from "react";
import { METHODOLOGIES } from "./presets";

// Picking a methodology from the dropdown appends it to the textarea (one per
// line), so several can be combined and the text edited freely.
export function MethodologyField({ className }: { className: string }) {
  const [value, setValue] = useState("");

  function add(method: string) {
    if (!method) return;
    const lines = value.split("\n").map((l) => l.trim());
    if (lines.includes(method)) return;
    setValue(value.trim() ? `${value.trim()}\n${method}` : method);
  }

  return (
    <div className="text-sm sm:col-span-2">
      <label htmlFor="methodology-select">Teaching/learning methodology</label>
      <select
        id="methodology-select"
        value=""
        onChange={(e) => add(e.target.value)}
        className={className}
      >
        <option value="">Add a methodology&hellip;</option>
        {METHODOLOGIES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <textarea
        name="methodology"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Teaching/learning methodology"
        className={className}
      />
    </div>
  );
}
