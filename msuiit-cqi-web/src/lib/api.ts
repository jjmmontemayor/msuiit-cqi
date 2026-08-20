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
  // A FormData body (file uploads) needs fetch to compute its own
  // multipart Content-Type with boundary -- forcing application/json here
  // would make the request unparsable on the server.
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: isFormData
      ? init?.headers
      : {
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
  credits: number | null;
  lectureHours: number | null;
  labHours: number | null;
  prerequisites: string | null;
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
  isPloAssessmentTarget: boolean;
  course: Course & { clos: Clo[] };
}

export interface Clo {
  id: string;
  courseId: string;
  curriculumVersionId: string;
  code: string;
  description: string;
  displayOrder: number;
  isLocked: boolean;
}

export interface CurriculumVersion {
  id: string;
  programId: string;
  code: string;
  description: string | null;
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

export interface MappingLevel {
  id: string;
  programId: string;
  code: 'I' | 'P' | 'D';
  displayCode: string;
  label: string;
  weight: number;
}

export type DisplayCodes = Record<'I' | 'P' | 'D', string>;

export function buildDisplayCodes(mappingLevels: MappingLevel[]): DisplayCodes {
  const codes = { I: 'I', P: 'P', D: 'D' };
  for (const level of mappingLevels) {
    codes[level.code] = level.displayCode;
  }
  return codes;
}

export interface Cohort {
  id: string;
  programId: string;
  curriculumVersionId: string | null;
  code: string;
  startYear: number;
  endYear: number;
  description: string | null;
}

export interface Faculty {
  id: string;
  programId: string;
  name: string;
  email: string | null;
  isActive: boolean;
}

export interface CohortAdviser {
  id: string;
  cohortId: string;
  facultyId: string;
  faculty: Faculty;
}

export interface AttainmentBenchmark {
  id: string;
  programId: string;
  percentage: number;
}

export interface CloPloMapping {
  id: string;
  cloId: string;
  ploId: string;
  curriculumVersionId: string;
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

export interface CloAttainmentByCourseRow {
  course_id: string;
  course_code: string;
  clo_id: string;
  clo_code: string;
  avg_score: string;
  attainment_count: string;
}

export interface CloAttainmentMatrixRow {
  student_id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  cohort_id: string;
  course_id: string;
  clo_code: string;
  score: string;
}

export interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  programId: string;
  cohortId: string | null;
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

export interface AcademicTerm {
  id: string;
  schoolYearStart: number;
  schoolYearEnd: number;
  semester: 'FIRST' | 'SECOND' | 'SUMMER';
  label: string;
}

export interface CourseOffering {
  id: string;
  courseId: string;
  academicTermId: string;
  section: string | null;
  instructorName: string | null;
  academicTerm: AcademicTerm;
}

export interface LearningPlanEntry {
  id: string;
  courseOfferingId: string;
  weekLabel: string;
  displayOrder: number;
  topics: string;
  lessonOutcome: string | null;
  coLabels: string | null;
  methodology: string | null;
  learningResources: string | null;
  assessment: string | null;
}

export interface AttainmentUploadResult {
  coursesMatched: string[];
  coursesSkipped: string[];
  studentsCreated: number;
  studentsExistingInProgram: number;
  studentsExistingOutOfProgram: number;
  enrollmentsRecorded: number;
  attainmentsRecorded: number;
  attainmentsSkippedNoClo: number;
}
