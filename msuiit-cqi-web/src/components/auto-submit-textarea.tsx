'use client';

// A <textarea> that submits its enclosing form when it loses focus after a
// change, mirroring AutoSubmitInput for longer text.
export function AutoSubmitTextarea({
  name,
  defaultValue,
  placeholder,
  rows,
  className,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      rows={rows}
      onBlur={(e) => {
        if (e.currentTarget.value !== (defaultValue ?? '')) {
          e.currentTarget.form?.requestSubmit();
        }
      }}
      className={className}
    />
  );
}
