"use client";

import { useState, useTransition } from "react";
import { saveOfferingReferences } from "../../../../../actions";

const inputClass =
  "w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900";

// Textbooks / references as individual items: add one at a time, click an item
// to edit it in place, × to remove. Every change is saved straight away.
export function ReferencesList({
  programId,
  courseId,
  offeringId,
  initial,
}: {
  programId: string;
  courseId: string;
  offeringId: string;
  initial: string[];
}) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function commit(next: string[]) {
    setItems(next);
    startTransition(async () => {
      await saveOfferingReferences(programId, courseId, offeringId, next);
    });
  }

  function add() {
    const value = draft.trim();
    if (!value) return;
    setDraft("");
    commit([...items, value]);
  }

  function finishEdit(i: number, value: string) {
    setEditing(null);
    const trimmed = value.trim();
    if (trimmed === items[i]) return;
    commit(
      trimmed ? items.map((r, j) => (j === i ? trimmed : r)) : items.filter((_, j) => j !== i),
    );
  }

  return (
    <div className={`space-y-2 ${isPending ? "opacity-70" : ""}`}>
      {items.length === 0 ? (
        <p className="text-xs text-neutral-500">No textbooks or references yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {items.map((ref, i) => (
            <li key={`${i}-${ref}`} className="flex items-start gap-2 px-2 py-1.5 text-sm">
              {editing === i ? (
                <input
                  autoFocus
                  defaultValue={ref}
                  onBlur={(e) => finishEdit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className={inputClass}
                />
              ) : (
                <button
                  type="button"
                  title="Click to edit"
                  onClick={() => setEditing(i)}
                  className="min-w-0 flex-1 text-left hover:underline"
                >
                  {ref}
                </button>
              )}
              <button
                type="button"
                aria-label={`Remove reference ${i + 1}`}
                title="Remove"
                onClick={() => commit(items.filter((_, j) => j !== i))}
                className="shrink-0 rounded px-1.5 text-neutral-500 hover:text-red-600"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a textbook or reference"
          className={inputClass}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-md border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Add
        </button>
      </div>
    </div>
  );
}
