import { apiFetch, type Program } from '@/lib/api';
import AttainmentsPage from '@/app/programs/[id]/(tabs)/plo-attainments/page';

export const dynamic = 'force-dynamic';

// Same report as the public program tab, hosted under the admin shell.
export default async function AdminPLOAttainmentsPage(
  props: React.ComponentProps<typeof AttainmentsPage>,
) {
  const { id } = await props.params;
  const program = await apiFetch<Program>(`/programs/${id}`);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">PLO Attainments — {program.code}</h1>
      <AttainmentsPage
        {...props}
        searchParams={props.searchParams.then((sp) => ({ ...sp, admin: '1' }))}
      />
    </div>
  );
}
