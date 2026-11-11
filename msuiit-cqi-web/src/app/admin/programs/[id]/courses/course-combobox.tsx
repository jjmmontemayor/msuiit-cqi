"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = { id: string; code: string; title: string };

// Type to filter courses by code or title, then pick one from the list. The
// chosen course id is submitted as `courseId`.
export function CourseCombobox({
  courses,
  className,
}: {
  courses: Option[];
  className: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Option | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? courses.filter(
          (c) =>
            c.code.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q),
        )
      : courses;
    return list.slice(0, 50);
  }, [courses, query]);

  // The field only validates once a course has been picked from the list.
  useEffect(() => {
    inputRef.current?.setCustomValidity(
      selected ? "" : "Pick a course from the list.",
    );
  }, [selected]);

  function choose(course: Option) {
    setSelected(course);
    setQuery(`${course.code} — ${course.title}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        required
        autoComplete="off"
        placeholder="Type a course code or title…"
        role="combobox"
        aria-expanded={open}
        aria-controls="course-combobox-list"
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && matches[active]) {
            e.preventDefault();
            choose(matches[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={className}
      />
      <input type="hidden" name="courseId" value={selected?.id ?? ""} />
      {open && (
        <ul
          id="course-combobox-list"
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-neutral-500">
              No matching courses.
            </li>
          ) : (
            matches.map((c, i) => (
              <li
                key={c.id}
                role="option"
                aria-selected={i === active}
                // mousedown runs before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(c);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-3 py-1.5 ${
                  i === active
                    ? "bg-neutral-100 dark:bg-neutral-800"
                    : ""
                }`}
              >
                <span className="font-medium">{c.code}</span>
                <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                  {c.title}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
