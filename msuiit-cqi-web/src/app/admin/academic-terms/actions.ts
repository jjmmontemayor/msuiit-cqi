'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

export async function createAcademicTerm(formData: FormData) {
  const schoolYearStart = Number(str(formData, 'schoolYearStart'));
  const schoolYearEnd = Number(str(formData, 'schoolYearEnd'));
  const semester = str(formData, 'semester');
  const label = str(formData, 'label');
  if (!schoolYearStart || !schoolYearEnd || !semester || !label) return;

  await apiFetch('/academic-terms', {
    method: 'POST',
    body: JSON.stringify({ schoolYearStart, schoolYearEnd, semester, label }),
  });

  revalidatePath('/admin/academic-terms');
}

export async function deleteAcademicTerm(termId: string) {
  await apiFetch(`/academic-terms/${termId}`, { method: 'DELETE' });
  revalidatePath('/admin/academic-terms');
}
