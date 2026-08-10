'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

export async function createFaculty(programId: string, formData: FormData) {
  const name = str(formData, 'name');
  const email = str(formData, 'email');
  if (!name) return;

  await apiFetch('/faculty', {
    method: 'POST',
    body: JSON.stringify({ programId, name, email: email || undefined }),
  });

  revalidatePath(`/admin/programs/${programId}/faculty`);
  revalidatePath(`/admin/programs/${programId}`);
}

export async function deleteFaculty(programId: string, facultyId: string) {
  await apiFetch(`/faculty/${facultyId}`, { method: 'DELETE' });
  revalidatePath(`/admin/programs/${programId}/faculty`);
  revalidatePath(`/admin/programs/${programId}`);
}
