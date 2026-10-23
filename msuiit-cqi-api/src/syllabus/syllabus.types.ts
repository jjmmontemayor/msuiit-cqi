export interface SyllabusData {
  course: {
    code: string;
    title: string;
    description: string | null;
    credits: number | null;
    prerequisites: string | null;
  };
  term: { schoolYearStart: number; schoolYearEnd: number; semester: 'FIRST' | 'SECOND' | 'SUMMER' };
  offering: {
    section: string | null;
    instructorName: string | null;
    modality: string | null;
    population: number | null;
    references: string | null;
    classroomPolicies: string | null;
    preparedBy: string | null;
    reviewedBy: string | null;
    approvedBy: string | null;
    courseworkWeight: number;
  };
  clos: {
    id: string;
    code: string;
    description: string;
    weight: number;
    taxonomy: string | null;
    evidenceReference: string | null;
  }[];
  tasks: { id: string; cloId: string; name: string; weight: number; maxScore: number }[];
  plos: { id: string; code: string; description: string }[];
  // `${cloId}::${ploId}` -> level display code
  mappings: Record<string, string>;
  plan: {
    weekLabel: string;
    topics: string;
    lessonOutcome: string | null;
    coLabels: string | null;
    methodology: string | null;
    learningResources: string | null;
    assessment: string | null;
  }[];
}

export const GRADE_SCALE: { min: number; max: string; grade: string }[] = [
  { min: 95.64, max: '100+', grade: '1.0' },
  { min: 91.18, max: '95.63', grade: '1.25' },
  { min: 86.73, max: '91.17', grade: '1.5' },
  { min: 82.27, max: '86.72', grade: '1.75' },
  { min: 77.82, max: '82.26', grade: '2.0' },
  { min: 73.36, max: '77.81', grade: '2.25' },
  { min: 68.91, max: '73.35', grade: '2.5' },
  { min: 64.45, max: '68.90', grade: '2.75' },
  { min: 60.0, max: '64.44', grade: '3.0' },
  { min: 0, max: '59.99', grade: '5.0' },
];
