"use client";

import Link from "next/link";
import { useState } from "react";
import { DoneButton, EditButton } from "@/components/icon-buttons";

// One course in the combined curriculum table. Read-only until its pencil is
// clicked, which swaps the year/semester and category cells for selects.
export function CourseTableRow({
  href,
  code,
  title,
  electiveGroup,
  yearLabel,
  termLabel,
  unitsLabel,
  categoryLabel,
  scheduleEditor,
  categoryEditor,
  tone,
}: {
  href: string;
  code: string;
  title: string;
  electiveGroup: string | null;
  yearLabel: string;
  termLabel: string;
  unitsLabel: string;
  categoryLabel: string;
  scheduleEditor: React.ReactNode;
  categoryEditor: React.ReactNode;
  tone: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <tr
      className={`border-t border-neutral-200 dark:border-neutral-800 ${tone} ${
        editing ? "ring-1 ring-inset ring-neutral-400" : ""
      }`}
    >
      <td className="whitespace-nowrap px-3 py-2 font-medium">
        <Link href={href} className="hover:underline">
          {code}
        </Link>
      </td>
      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
        {title}
        {electiveGroup && (
          <span className="ml-2 text-xs text-neutral-400">
            ({electiveGroup})
          </span>
        )}
      </td>
      {editing ? (
        <td colSpan={2} className="px-3 py-2">
          {scheduleEditor}
        </td>
      ) : (
        <>
          <td className="whitespace-nowrap px-3 py-2">{yearLabel}</td>
          <td className="whitespace-nowrap px-3 py-2">{termLabel}</td>
        </>
      )}
      <td className="whitespace-nowrap px-3 py-2 text-right">{unitsLabel}</td>
      <td className="whitespace-nowrap px-3 py-2">
        {editing ? categoryEditor : categoryLabel}
      </td>
      <td className="px-3 py-2 text-right">
        {editing ? (
          <DoneButton
            title={`Done editing ${code}`}
            onClick={() => setEditing(false)}
            className="inline-flex items-center justify-center rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
          />
        ) : (
          <EditButton title={`Edit ${code}`} onClick={() => setEditing(true)} />
        )}
      </td>
    </tr>
  );
}
