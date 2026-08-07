'use client';

import { useRouter } from 'next/navigation';

// Goes back to wherever the user actually came from (browser history)
// instead of a hardcoded destination — these pages are reachable from
// several different entry points, so no single href is always correct.
export function BackLink({
  label,
  fallbackHref,
}: {
  label: string;
  fallbackHref: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="text-sm text-neutral-500 hover:underline"
    >
      &larr; {label}
    </button>
  );
}
