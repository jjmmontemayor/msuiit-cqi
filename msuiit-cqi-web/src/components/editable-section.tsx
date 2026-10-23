"use client";

import { useState } from "react";
import { DoneButton, EditButton } from "@/components/icon-buttons";

// `dataKey` should change whenever the section's saved data changes. Editing is
// tied to the key it was opened under, so a successful save (new data) drops the
// section back to view mode without any effect or manual reset.
export function EditableSection({
  title,
  description,
  dataKey,
  headerExtra,
  view,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  dataKey: string;
  headerExtra?: React.ReactNode;
  view: React.ReactNode;
  children: React.ReactNode;
}) {
  const [editKey, setEditKey] = useState<string | null>(null);
  const editing = editKey === dataKey;

  return (
    <section className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">{title}</h2>
        <div className="flex shrink-0 items-center gap-3">
          {headerExtra}
          {editing ? (
            <DoneButton onClick={() => setEditKey(null)} />
          ) : (
            <EditButton onClick={() => setEditKey(dataKey)} />
          )}
        </div>
      </div>
      {editing ? (
        <>
          {description && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          )}
          {children}
        </>
      ) : (
        <div className="mt-3">{view}</div>
      )}
    </section>
  );
}
