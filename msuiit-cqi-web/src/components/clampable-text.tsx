'use client';

import { useState } from 'react';

// Individually click-to-expand; a page-level "expand all" checkbox can
// override every instance at once via the .clo-expand-scope CSS rule in
// globals.css, without needing to lift state up to a shared React parent.
export function ClampableText({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded((e) => !e)}
      title={expanded ? 'Click to collapse' : 'Click to expand'}
      className={`clo-desc cursor-pointer ${expanded ? '' : 'line-clamp-2'} ${className ?? ''}`}
    >
      {text}
    </div>
  );
}
