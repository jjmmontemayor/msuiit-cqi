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

export interface CloPloMapping {
  id: string;
  cloId: string;
  ploId: string;
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
}

export interface PloAttainmentByStudentRow {
  student_id: string;
  student_number: string;
  plo_id: string;
  plo_code: string;
  weighted_attainment: string;
  attainment_count: string;
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
