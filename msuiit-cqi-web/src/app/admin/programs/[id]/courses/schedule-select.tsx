"use client";

const YEARS = [1, 2, 3, 4, 5, 6];
const TERMS = ["1st Sem", "2nd Sem", "Summer"];

const selectClass =
  "rounded border border-neutral-300 px-1.5 py-0.5 text-xs dark:border-neutral-700 dark:bg-neutral-900";

// Saves as soon as either the year or the semester changes.
export function ScheduleSelect({
  action,
  yearLevel,
  term,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  yearLevel: number | null;
  term: string | null;
  label: string;
}) {
  const submit = (e: React.ChangeEvent<HTMLSelectElement>) =>
    e.currentTarget.form?.requestSubmit();
  return (
    <form action={action} className="flex shrink-0 items-center gap-1">
      <select
        name="yearLevel"
        defaultValue={yearLevel ?? ""}
        aria-label={`Year for ${label}`}
        onChange={submit}
        className={selectClass}
      >
        <option value="">Year&hellip;</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            Year {y}
          </option>
        ))}
      </select>
      <select
        name="term"
        defaultValue={term ?? ""}
        aria-label={`Semester for ${label}`}
        onChange={submit}
        className={selectClass}
      >
        <option value="">Semester&hellip;</option>
        {TERMS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
        {term && !TERMS.includes(term) && <option value={term}>{term}</option>}
      </select>
    </form>
  );
}
