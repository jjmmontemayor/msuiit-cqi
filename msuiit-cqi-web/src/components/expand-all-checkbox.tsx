'use client';

// Pairs with ClampableText + the .clo-expand-scope CSS rule in globals.css:
// checking this overrides every ClampableText in the same scope to its
// expanded state, purely via CSS (:has()), no React state lifting needed.
export function ExpandAllCheckbox() {
  return (
    <label className="flex items-center gap-1.5 text-sm">
      <input
        type="checkbox"
        className="expand-all-clos rounded border-neutral-300 dark:border-neutral-700"
      />
      Expand all descriptions
    </label>
  );
}
