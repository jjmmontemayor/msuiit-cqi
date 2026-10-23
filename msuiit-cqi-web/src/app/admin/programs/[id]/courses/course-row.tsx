"use client";

import Link from "next/link";
import { useState } from "react";
import { DoneButton, EditButton } from "@/components/icon-buttons";
import { DRAG_TYPE } from "./drop-zone";

// One course in the curriculum. Read-only until its pencil is clicked; while
// editing it can be dragged onto another year / semester card.
export function CourseRow({
  id,
  href,
  code,
  title,
  electiveGroup,
  unitsLabel,
  term,
  summary,
  editor,
}: {
  id: string;
  href: string;
  code: string;
  title: string;
  electiveGroup: string | null;
  unitsLabel: string;
  term: string | null;
  summary: string;
  editor: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  const label = (
    <>
      <span className="font-medium">{code}</span>
      <span className="ml-2 text-neutral-600 dark:text-neutral-400">
        {title}
      </span>
      {electiveGroup && (
        <span className="ml-2 text-xs text-neutral-400">({electiveGroup})</span>
      )}
    </>
  );

  return (
    <li
      draggable={editing}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ id, term }));
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`flex items-center justify-between gap-3 ${
        editing ? "cursor-grab bg-neutral-50 dark:bg-neutral-900" : ""
      }`}
    >
      {editing ? (
        <span className="min-w-0 flex-1 px-4 py-2.5">
          <span aria-hidden className="mr-2 text-neutral-400">
            &#8942;&#8942;
          </span>
          {label}
        </span>
      ) : (
        <Link
          href={href}
          className="min-w-0 flex-1 px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          {label}
        </Link>
      )}
      <span className="w-16 shrink-0 text-right text-sm text-neutral-600 dark:text-neutral-400">
        {unitsLabel}
      </span>
      {editing ? (
        editor
      ) : (
        <span className="w-52 shrink-0 text-right text-xs text-neutral-500">
          {summary}
        </span>
      )}
      {editing ? (
        <DoneButton
          title={`Done editing ${code}`}
          onClick={() => setEditing(false)}
          className="mr-3 inline-flex shrink-0 items-center justify-center rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
        />
      ) : (
        <EditButton title={`Edit ${code}`} onClick={() => setEditing(true)} />
      )}
    </li>
  );
}
