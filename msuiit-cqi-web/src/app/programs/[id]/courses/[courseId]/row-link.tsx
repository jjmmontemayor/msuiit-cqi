"use client";

import { useRouter } from "next/navigation";

// A table row that opens `href` when clicked anywhere except on a control
// inside it (links, buttons, form fields).
export function RowLink({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a,button,input,select,textarea,form,label"))
          return;
        router.push(href);
      }}
      className={`cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 ${className}`}
    >
      {children}
    </tr>
  );
}
