'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

export async function setMappingPi(
  programCode: string,
  mappingId: string,
  piId: string,
  assessmentMethod: string,
) {
  await apiFetch(`/mappings/${mappingId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      piId: piId || null,
      assessmentMethod: assessmentMethod || undefined,
    }),
  });

  revalidatePath(`/programs/${programCode}/clo-pi-mapping`);
}
