'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError, type AttainmentUploadResult, type Clo, type MappingLevel } from '@/lib/api';

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function optInt(formData: FormData, key: string): number | undefined {
  const raw = formData.get(key);
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export async function updateMappingLevelWeights(programId: string, formData: FormData) {
  const levels = await apiFetch<MappingLevel[]>(`/mapping-levels?programId=${programId}`);
  await Promise.all(
    levels.map((level) => {
      const weight = optInt(formData, `weight_${level.code}`);
      if (weight == null) return Promise.resolve();
      return apiFetch(`/mapping-levels/${level.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ weight }),
      });
    }),
  );

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}`, 'layout');
}

export async function updateAttainmentBenchmark(programId: string, formData: FormData) {
  const percentage = optInt(formData, 'percentage');
  if (percentage == null) return;

  await apiFetch(`/attainment-benchmark?programId=${programId}`, {
    method: 'PATCH',
    body: JSON.stringify({ percentage }),
  });

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}`, 'layout');
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

export async function addCohortAdviser(
  programId: string,
  cohortId: string,
  formData: FormData,
) {
  const facultyId = str(formData, 'facultyId');
  if (!facultyId) return;

  await apiFetch('/cohort-advisers', {
    method: 'POST',
    body: JSON.stringify({ cohortId, facultyId }),
  });

  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}/clo-attainments`);
}

export async function removeCohortAdviser(programId: string, cohortAdviserId: string) {
  await apiFetch(`/cohort-advisers/${cohortAdviserId}`, { method: 'DELETE' });
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/programs/${programId}/clo-attainments`);
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

export async function updateCourseDetails(
  programId: string,
  courseId: string,
  formData: FormData,
) {
  const code = str(formData, 'code');
  const title = str(formData, 'title');
  const description = str(formData, 'description');
  const prerequisites = str(formData, 'prerequisites');

  await apiFetch(`/courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      code,
      title,
      description: description || undefined,
      credits: optInt(formData, 'credits'),
      lectureHours: optInt(formData, 'lectureHours'),
      labHours: optInt(formData, 'labHours'),
      prerequisites: prerequisites || undefined,
    }),
  });

  revalidatePath(`/admin/programs/${programId}/courses/${courseId}`);
  revalidatePath(`/admin/programs/${programId}`);
}

function revalidateCoursePaths(programId: string, courseId: string) {
  revalidatePath(`/admin/programs/${programId}/courses/${courseId}`);
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath(`/admin/programs/${programId}/mappings`);
  revalidatePath(`/programs/${programId}/courses/${courseId}`);
  revalidatePath(`/programs/${programId}/mappings`);
}

export async function createClo(
  programId: string,
  courseId: string,
  cohortId: string,
  formData: FormData,
) {
  const description = str(formData, 'description');

  const existing = await apiFetch<Clo[]>(
    `/clos?courseId=${courseId}&cohortId=${cohortId}`,
  );
  const nextNumber =
    1 +
    existing.reduce((max, clo) => {
      const n = Number(clo.code.match(/^CLO(\d+)$/)?.[1]);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0);
  const code = `CLO${nextNumber}`;

  await apiFetch('/clos', {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      cohortId,
      code,
      description,
      displayOrder: optInt(formData, 'displayOrder') ?? nextNumber,
    }),
  });

  revalidateCoursePaths(programId, courseId);
}

export async function deleteClo(programId: string, courseId: string, cloId: string) {
  await apiFetch(`/clos/${cloId}`, { method: 'DELETE' });
  revalidateCoursePaths(programId, courseId);
}

export async function updateCloText(
  programId: string,
  courseId: string,
  cloId: string,
  description: string,
) {
  await apiFetch(`/clos/${cloId}`, {
    method: 'PATCH',
    body: JSON.stringify({ description }),
  });
  revalidateCoursePaths(programId, courseId);
}

export async function setCloLock(
  programId: string,
  courseId: string,
  cloId: string,
  isLocked: boolean,
) {
  await apiFetch(`/clos/${cloId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isLocked }),
  });
  revalidateCoursePaths(programId, courseId);
}

export async function duplicateCloToCohort(
  programId: string,
  courseId: string,
  cloId: string,
  formData: FormData,
) {
  const cohortId = str(formData, 'targetCohortId');
  if (!cohortId) return;

  await apiFetch(`/clos/${cloId}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({ cohortId }),
  });

  revalidateCoursePaths(programId, courseId);
}

export type UploadAttainmentSheetState = AttainmentUploadResult | { error: string } | null;

export async function uploadAttainmentSheet(
  programId: string,
  courseId: string,
  _prevState: UploadAttainmentSheetState,
  formData: FormData,
): Promise<UploadAttainmentSheetState> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a file to upload.' };
  }

  const apiForm = new FormData();
  apiForm.set('file', file);
  apiForm.set('programId', programId);

  const schoolYear = str(formData, 'schoolYear');
  const [schoolYearStart, schoolYearEnd] = schoolYear.split('-');
  if (schoolYearStart) apiForm.set('schoolYearStart', schoolYearStart);
  if (schoolYearEnd) apiForm.set('schoolYearEnd', schoolYearEnd);

  const semester = str(formData, 'semester');
  if (semester) apiForm.set('semester', semester);

  const section = str(formData, 'section');
  if (section) apiForm.set('section', section);

  try {
    const result = await apiFetch<AttainmentUploadResult>('/attainment-uploads', {
      method: 'POST',
      body: apiForm,
    });
    revalidateCoursePaths(programId, courseId);
    revalidatePath(`/programs/${programId}/clo-attainments`);
    revalidatePath(`/programs/${programId}/plo-attainments`);
    return result;
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : 'Upload failed.' };
  }
}
