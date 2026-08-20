'use client';

// Submits its enclosing form immediately on change, so a filter checkbox
// doesn't need a separate "View"/"Apply" button click.
export function AutoSubmitCheckbox({
  name,
  value,
  defaultChecked,
  label,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  label: string;
}) {
  return (
    <label className="flex items-center gap-1.5 pb-1.5 text-sm">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border-neutral-300 dark:border-neutral-700"
      />
      {label}
    </label>
  );
}
