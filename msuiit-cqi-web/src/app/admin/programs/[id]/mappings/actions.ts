'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, type Clo, type CloPloMapping } from '@/lib/api';

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

// CLOs (and their mappings) are cohort-scoped, so "copying" from another
// batch means creating this batch's own version of each CLO the source
// batch has -- via the same duplicateToCohort path used for versioning a
// single CLO. It's idempotent: a CLO the target cohort already has (same
// course + code) is left untouched rather than overwritten.
export async function copyMappingsFromCohort(
  programId: string,
  targetCohortId: string,
  formData: FormData,
) {
  const sourceCohortId = String(formData.get('sourceCohortId') ?? '');
  if (!sourceCohortId || sourceCohortId === targetCohortId) return;

  const sourceClos = await apiFetch<Clo[]>(`/clos?cohortId=${sourceCohortId}`);

  await Promise.all(
    sourceClos.map((clo) =>
      apiFetch(`/clos/${clo.id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ cohortId: targetCohortId }),
      }),
    ),
  );

  revalidatePath(`/admin/programs/${programId}/mappings`);
  revalidatePath(`/programs/${programId}/mappings`);
}
