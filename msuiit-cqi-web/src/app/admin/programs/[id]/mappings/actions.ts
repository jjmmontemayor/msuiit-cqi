'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, type Clo, type CloPloMapping } from '@/lib/api';

export async function setMapping(
  programId: string,
  curriculumVersionId: string,
  cloId: string,
  ploId: string,
  levelCode: 'I' | 'P' | 'D' | '',
) {
  const existing = await apiFetch<CloPloMapping[]>(
    `/mappings?cloId=${cloId}&ploId=${ploId}&curriculumVersionId=${curriculumVersionId}`,
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
      body: JSON.stringify({ cloId, ploId, curriculumVersionId, levelCode }),
    });
  }

  revalidatePath(`/admin/programs/${programId}/mappings`);
  revalidatePath(`/programs/${programId}/mappings`);
}

// CLOs (and their mappings) are curriculum-version-scoped, so "copying" from
// another version means creating this version's own copy of each CLO the
// source version has -- via the same duplicateToVersion path used for
// versioning a single CLO. It's idempotent: a CLO the target version already
// has (same course + code) is left untouched rather than overwritten.
export async function copyMappingsFromVersion(
  programId: string,
  targetCurriculumVersionId: string,
  formData: FormData,
) {
  const sourceCurriculumVersionId = String(formData.get('sourceCurriculumVersionId') ?? '');
  if (!sourceCurriculumVersionId || sourceCurriculumVersionId === targetCurriculumVersionId) return;

  const sourceClos = await apiFetch<Clo[]>(
    `/clos?curriculumVersionId=${sourceCurriculumVersionId}`,
  );

  await Promise.all(
    sourceClos.map((clo) =>
      apiFetch(`/clos/${clo.id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ curriculumVersionId: targetCurriculumVersionId }),
      }),
    ),
  );

  revalidatePath(`/admin/programs/${programId}/mappings`);
  revalidatePath(`/programs/${programId}/mappings`);
}
