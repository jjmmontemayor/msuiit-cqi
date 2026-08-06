'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, type CloPloMapping } from '@/lib/api';

export async function setMapping(
  programId: string,
  cohortId: string,
  cloId: string,
  ploId: string,
  levelCode: 'I' | 'P' | 'D' | '',
) {
  const existing = await apiFetch<CloPloMapping[]>(
    `/mappings?cloId=${cloId}&ploId=${ploId}&cohortId=${cohortId}`,
  );

  if (!levelCode) {
    if (existing[0]) {
      await apiFetch(`/mappings/${existing[0].id}`, { method: 'DELETE' });
    }
  } else if (existing[0]) {
    await apiFetch(`/mappings/${existing[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ levelCode }),
    });
  } else {
    await apiFetch('/mappings', {
      method: 'POST',
      body: JSON.stringify({ cloId, ploId, cohortId, levelCode }),
    });
  }

  revalidatePath(`/admin/programs/${programId}/mappings`);
  revalidatePath(`/programs/${programId}/mappings`);
}

export async function copyMappingsFromCohort(
  programId: string,
  targetCohortId: string,
  formData: FormData,
) {
  const sourceCohortId = String(formData.get('sourceCohortId') ?? '');
  if (!sourceCohortId || sourceCohortId === targetCohortId) return;

  const [sourceMappings, existingTargetMappings] = await Promise.all([
    apiFetch<CloPloMapping[]>(`/mappings?cohortId=${sourceCohortId}`),
    apiFetch<CloPloMapping[]>(`/mappings?cohortId=${targetCohortId}`),
  ]);

  const existingKeys = new Set(
    existingTargetMappings.map((m) => `${m.cloId}::${m.ploId}`),
  );

  await Promise.all(
    sourceMappings
      .filter((m) => !existingKeys.has(`${m.cloId}::${m.ploId}`))
      .map((m) =>
        apiFetch('/mappings', {
          method: 'POST',
          body: JSON.stringify({
            cloId: m.cloId,
            ploId: m.ploId,
            cohortId: targetCohortId,
            levelCode: m.levelCode,
            piId: m.piId ?? undefined,
            assessmentMethod: m.assessmentMethod ?? undefined,
          }),
        }),
      ),
  );

  revalidatePath(`/admin/programs/${programId}/mappings`);
  revalidatePath(`/programs/${programId}/mappings`);
}
