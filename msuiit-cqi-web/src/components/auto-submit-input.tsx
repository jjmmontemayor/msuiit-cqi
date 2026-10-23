"use client";

// An <input> that submits its enclosing form when it loses focus with a changed
// value (or on Enter), so inline-edit cells need no Save button.
export function AutoSubmitInput({
  name,
  defaultValue,
  type = "text",
  className,
  ...rest
}: Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onBlur" | "defaultValue"
> & {
  name: string;
  defaultValue?: string | number | null;
}) {
  const initial = String(defaultValue ?? "");
  return (
    <input
      name={name}
      type={type}
      defaultValue={initial}
      onBlur={(e) => {
        if (e.currentTarget.value !== initial)
          e.currentTarget.form?.requestSubmit();
      }}
      className={className}
      {...rest}
    />
  );
}
