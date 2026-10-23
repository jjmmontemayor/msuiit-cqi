import { notFound } from 'next/navigation';
import { apiFetch, ApiError, type Program } from '@/lib/api';
import { ProgramSettingsSections } from '../../program-settings-sections';

export const dynamic = 'force-dynamic';

async function getProgram(id: string): Promise<Program> {
  try {
    return await apiFetch<Program>(`/programs/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
}

export default async function ProgramDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mappingLevelError?: string }>;
}) {
  const { id } = await params;
  const { mappingLevelError } = await searchParams;
  const program = await getProgram(id);

  return <ProgramSettingsSections program={program} mappingLevelError={mappingLevelError} />;
}
