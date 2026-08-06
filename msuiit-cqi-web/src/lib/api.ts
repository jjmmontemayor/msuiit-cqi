const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export interface Program {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
}

export interface CurriculumCourse {
  id: string;
  programId: string;
  courseId: string;
  electiveGroup: string | null;
  yearLevel: number | null;
  term: string | null;
  displayOrder: number;
  isActive: boolean;
  course: Course & { clos: Clo[] };
}

export interface Clo {
  id: string;
  courseId: string;
  code: string;
  description: string;
  displayOrder: number;
}

export interface Plo {
  id: string;
  programId: string;
  code: string;
  description: string;
  displayOrder: number;
  performanceIndicators?: PerformanceIndicator[];
}

export interface PerformanceIndicator {
  id: string;
  ploId: string;
  code: string;
  description: string;
  displayOrder: number;
}

export interface Cohort {
  id: string;
  programId: string;
  code: string;
  startYear: number;
  endYear: number;
  description: string | null;
}

export interface CloPloMapping {
  id: string;
  cloId: string;
  ploId: string;
  cohortId: string;
  levelCode: 'I' | 'P' | 'D';
  piId: string | null;
  assessmentMethod: string | null;
}

export interface PloAttainmentByCourseRow {
  course_id: string;
  course_code: string;
  plo_id: string;
  plo_code: string;
  weighted_attainment: string;
  attainment_count: string;
  cohort_id: string;
  cohort_code: string;
}

export interface PloAttainmentByStudentRow {
  student_id: string;
  student_number: string;
  plo_id: string;
  plo_code: string;
  weighted_attainment: string;
  attainment_count: string;
  cohort_id: string;
}

export interface CloAttainmentByStudentRow {
  course_id: string;
  course_code: string;
  clo_id: string;
  clo_code: string;
  score: string;
}

export interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  programId: string;
  cohortId: string;
  status: 'ACTIVE' | 'GRADUATED' | 'WITHDRAWN';
}

export interface PiEvaluation {
  id: string;
  piId: string;
  cohortId: string;
  benchmarkDescription: string | null;
  targetPercentage: string | null;
  resultsNarrative: string | null;
  status: 'DRAFT' | 'FINAL';
}
