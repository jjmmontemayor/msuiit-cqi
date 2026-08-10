'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { segment: 'mappings', label: 'CLO-PLO Mapping' },
  { segment: 'clo-attainments', label: 'CLO Attainments' },
  { segment: 'plo-attainments', label: 'PLO Attainments' },
  { segment: 'evaluations', label: 'Evaluations' },
];

export function ProgramTabs({ programId }: { programId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
      {TABS.map((tab) => {
        const href = `/programs/${programId}/${tab.segment}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.segment}
            href={href}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              active
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
