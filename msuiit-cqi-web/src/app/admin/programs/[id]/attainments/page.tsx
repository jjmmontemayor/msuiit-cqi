import { redirect } from 'next/navigation';

export default async function ProgramAttainmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/programs/${id}/attainments/clo`);
}
