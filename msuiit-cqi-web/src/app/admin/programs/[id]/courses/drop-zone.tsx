"use client";

import { useState, useTransition } from "react";

export const DRAG_TYPE = "application/x-curriculum-course";

// Accepts a dragged course row. A semester zone sets both year and term; a year
// zone (term === undefined) moves the course to that year and keeps its term.
export function DropZone({
  action,
  yearLevel,
  term,
  className,
  children,
}: {
  action: (
    curriculumCourseId: string,
    yearLevel: number | null,
    term: string | null,
  ) => Promise<void>;
  yearLevel: number | null;
  term?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={`${className ?? ""} ${over ? "ring-2 ring-blue-400" : ""} ${pending ? "opacity-60" : ""}`}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setOver(false);
      }}
      onDrop={(e) => {
        const raw = e.dataTransfer.getData(DRAG_TYPE);
        if (!raw) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const dragged = JSON.parse(raw) as { id: string; term: string | null };
        startTransition(() =>
          action(dragged.id, yearLevel, term ?? dragged.term),
        );
      }}
    >
      {children}
    </div>
  );
}
