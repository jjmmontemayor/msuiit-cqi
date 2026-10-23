"use client";

// A form that asks for confirmation before submitting, for destructive actions.
export function ConfirmForm({
  action,
  message,
  children,
}: {
  action: () => Promise<void>;
  message: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
