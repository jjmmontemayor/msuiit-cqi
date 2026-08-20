import { apiFetch, type Program } from '@/lib/api';
import { AdminSidebar } from './admin-sidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const programs = await apiFetch<Program[]>('/programs');

  return (
    <div className="flex items-start gap-6">
      <AdminSidebar programs={programs} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
