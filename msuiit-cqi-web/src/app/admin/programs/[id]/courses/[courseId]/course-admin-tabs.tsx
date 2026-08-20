'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function CourseAdminTabs({
  programId,
  courseId,
}: {
  programId: string;
  courseId: string;
}) {
  const pathname = usePathname();
  const base = `/admin/programs/${programId}/courses/${courseId}`;
  const tabs = [
    { href: base, label: 'Course Details & CLOs' },
    { href: `${base}/learning-plan`, label: 'Learning Plan' },
  ];

  return (
    <nav className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
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
