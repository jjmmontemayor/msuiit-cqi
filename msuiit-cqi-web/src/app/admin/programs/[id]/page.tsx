import { redirect } from 'next/navigation';

export default async function AdminProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/programs/${id}/settings/details`);
}
