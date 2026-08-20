'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Program } from '@/lib/api';

export function AdminSidebar({ programs }: { programs: Program[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const currentProgramId = pathname.match(/^\/admin\/programs\/([^/]+)/)?.[1] ?? null;

  const navItems = currentProgramId
    ? [
        { href: `/admin/programs/${currentProgramId}/dashboard`, label: 'Dashboard' },
        { href: `/admin/programs/${currentProgramId}/courses`, label: 'Courses' },
        { href: `/admin/programs/${currentProgramId}/attainments`, label: 'Attainments' },
        { href: `/admin/programs/${currentProgramId}`, label: 'Program Settings' },
      ]
    : [];

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        title="Expand navigation"
        aria-label="Expand navigation"
        className="h-fit shrink-0 rounded-md border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
      >
        &#9776;
      </button>
    );
  }

  return (
    <aside className="w-56 shrink-0 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Admin
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Collapse navigation"
          aria-label="Collapse navigation"
          className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          &#171;
        </button>
      </div>

      <div>
        <label className="text-xs text-neutral-500">Program</label>
        <select
          value={currentProgramId ?? ''}
          onChange={(e) => {
            if (e.target.value) router.push(`/admin/programs/${e.target.value}/dashboard`);
          }}
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="" disabled>
            Select a program&hellip;
          </option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>
      </div>

      {currentProgramId && (
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-2 py-1.5 text-sm ${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="space-y-0.5 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <Link
          href="/admin"
          className="block rounded-md px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
        >
          All Programs
        </Link>
        <Link
          href="/admin/academic-terms"
          className="block rounded-md px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
        >
          Academic Terms
        </Link>
      </div>
    </aside>
  );
}
