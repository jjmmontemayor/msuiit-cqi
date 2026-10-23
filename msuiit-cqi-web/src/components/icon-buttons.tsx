// Standard icon-only action buttons (edit, done, cancel, delete) used across
// the app so every page shows the same controls.

type IconButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
>;

const base =
  "inline-flex shrink-0 items-center justify-center rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200";
const danger =
  "inline-flex shrink-0 items-center justify-center rounded-md p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400";

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 20 20",
  fill: "currentColor",
  className: "h-4 w-4",
  "aria-hidden": true,
} as const;

export function PencilIcon() {
  return (
    <svg {...iconProps}>
      <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.796 2.796 6.79-6.882a1 1 0 0 1 1.414-.02Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function EditButton({ title = "Edit", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={base}
      {...props}
    >
      <PencilIcon />
    </button>
  );
}

export function DoneButton({ title = "Done", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={base}
      {...props}
    >
      <CheckIcon />
    </button>
  );
}

export function CancelButton({ title = "Cancel", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={base}
      {...props}
    >
      <XIcon />
    </button>
  );
}

export function DeleteButton({ title = "Delete", ...props }: IconButtonProps) {
  return (
    <button
      type="submit"
      title={title}
      aria-label={title}
      className={danger}
      {...props}
    >
      <TrashIcon />
    </button>
  );
}

// Same look as EditButton but as a link, for "go edit this elsewhere".
export const iconLinkClass = base;
