'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, type CloPiMapping } from '@/lib/api';

export async function setCloPiMapping(
  programCode: string,
  curriculumVersionId: string,
  cloId: string,
  piId: string,
  mappingLevelId: string,
  assessmentMethod: string,
) {
  const existing = await apiFetch<CloPiMapping[]>(
    `/clo-pi-mappings?cloId=${cloId}&piId=${piId}&curriculumVersionId=${curriculumVersionId}`,
  );

  if (!mappingLevelId) {
    if (existing[0]) {
      await apiFetch(`/clo-pi-mappings/${existing[0].id}`, { method: 'DELETE' });
    }
  } else if (existing[0]) {
    await apiFetch(`/clo-pi-mappings/${existing[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ mappingLevelId, assessmentMethod: assessmentMethod || undefined }),
    });
  } else {
    await apiFetch('/clo-pi-mappings', {
      method: 'POST',
      body: JSON.stringify({
        cloId,
        piId,
        curriculumVersionId,
        mappingLevelId,
        assessmentMethod: assessmentMethod || undefined,
      }),
    });
  }

  revalidatePath(`/programs/${programCode}/clo-pi-mapping`);
}
