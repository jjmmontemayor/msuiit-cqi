import { redirect } from 'next/navigation';

export default async function ProgramIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/programs/${id}/mappings`);
}
