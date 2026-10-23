'use client';

// A <select> that submits its enclosing form as soon as the choice changes, so
// a filter doesn't need a separate "View" button.
export function AutoSubmitSelect({
  name,
  defaultValue,
  className,
  children,
}: {
  name: string;
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={className}
    >
      {children}
    </select>
  );
}
