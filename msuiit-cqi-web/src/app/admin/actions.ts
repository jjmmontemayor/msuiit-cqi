'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function optInt(formData: FormData, key: string): number | undefined {
  const raw = formData.get(key);
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export async function createProgram(formData: FormData) {
  const code = str(formData, 'code');
  const name = str(formData, 'name');
  const description = str(formData, 'description');

  const program = await apiFetch<{ id: string }>('/programs', {
    method: 'POST',
    body: JSON.stringify({
      code,
      name,
      description: description || undefined,
    }),
  });

  revalidatePath('/admin');
  revalidatePath('/');
  redirect(`/admin/programs/${program.id}`);
}

export async function createCohort(programId: string, formData: FormData) {
  const code = str(formData, 'code');
  const startYear = optInt(formData, 'startYear');
  const endYear = optInt(formData, 'endYear');
  const description = str(formData, 'description');

  await apiFetch('/cohorts', {
    method: 'POST',
    body: JSON.stringify({
      programId,
      code,
      startYear,
      endYear,
      description: description || undefined,
    }),
  });

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}`);
}

export async function deleteCohort(programId: string, cohortId: string) {
  await apiFetch(`/cohorts/${cohortId}`, { method: 'DELETE' });
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}`);
}

export async function createPlo(programId: string, formData: FormData) {
  const code = str(formData, 'code');
  const description = str(formData, 'description');

  await apiFetch('/plos', {
    method: 'POST',
    body: JSON.stringify({
      programId,
      code,
      description,
      displayOrder: optInt(formData, 'displayOrder'),
    }),
  });

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}`);
}

export async function deletePlo(programId: string, ploId: string) {
  await apiFetch(`/plos/${ploId}`, { method: 'DELETE' });
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}`);
}

export async function linkExistingCourse(programId: string, formData: FormData) {
  const courseId = str(formData, 'courseId');
  if (!courseId) return;

  await apiFetch('/curriculum-courses', {
    method: 'POST',
    body: JSON.stringify({
      programId,
      courseId,
      yearLevel: optInt(formData, 'yearLevel'),
      term: str(formData, 'term') || undefined,
      electiveGroup: str(formData, 'electiveGroup') || undefined,
    }),
  });

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}`);
}

export async function createAndLinkCourse(programId: string, formData: FormData) {
  const code = str(formData, 'code');
  const title = str(formData, 'title');
  const description = str(formData, 'description');

  const course = await apiFetch<{ id: string }>('/courses', {
    method: 'POST',
    body: JSON.stringify({ code, title, description: description || undefined }),
  });

  await apiFetch('/curriculum-courses', {
    method: 'POST',
    body: JSON.stringify({
      programId,
      courseId: course.id,
      yearLevel: optInt(formData, 'yearLevel'),
      term: str(formData, 'term') || undefined,
      electiveGroup: str(formData, 'electiveGroup') || undefined,
    }),
  });

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}`);
}

export async function unlinkCourse(programId: string, curriculumCourseId: string) {
  await apiFetch(`/curriculum-courses/${curriculumCourseId}`, {
    method: 'DELETE',
  });
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}`);
}

export async function createClo(
  programId: string,
  courseId: string,
  formData: FormData,
) {
  const code = str(formData, 'code');
  const description = str(formData, 'description');

  await apiFetch('/clos', {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      code,
      description,
      displayOrder: optInt(formData, 'displayOrder'),
    }),
  });

  revalidatePath(`/admin/programs/${programId}/courses/${courseId}`);
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}/mappings`);
}

export async function deleteClo(programId: string, courseId: string, cloId: string) {
  await apiFetch(`/clos/${cloId}`, { method: 'DELETE' });
  revalidatePath(`/admin/programs/${programId}/courses/${courseId}`);
  revalidatePath(`/programs/${programId}/mappings`);
}
