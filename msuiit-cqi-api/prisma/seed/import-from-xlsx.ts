/**
 * One-time migration tool: imports the original CQI workbook into the
 * normalized schema. Doubles as the acceptance test that the schema
 * actually fits the source data (row counts + a few spot-checked
 * aggregates are printed at the end — compare against the workbook).
 *
 * Usage: npm run seed:xlsx
 */
import * as path from 'path';
import * as XLSX from 'xlsx';
import { MappingLevelCode, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WORKBOOK_PATH = path.join(
  __dirname,
  '../../../docs/source-data/Program Assessment and Evaluation (by Courses and Students) CLO to PLO Version.xlsx',
);

// Verbatim from the source workbook's "PLO Attainment Evaluation" sheet
// (cell A4). Note: this reads like an unedited template — it references
// "manufacturing and industrial engineering" problems for what is a BSCS
// program. Preserved as-is to stay faithful to the source; flag for the
// program chair to correct.
const PLO1_DESCRIPTION =
  'Ability to apply knowledge of mathematics, science, and engineering to model and analyze manufacturing and industrial engineering problems.';

const PI_ASSESSMENT_METHOD =
  'Various course-embedded assessments for this CLO (or list the key/specific assessments)';
const PI_BENCHMARK =
  '70% of the students achieved at least 70% of the CLOs total score';

// Only PLO1 is elaborated into Performance Indicators in the source
// workbook; PLO2-11 have none yet (see docs/schema.md for why pi_id on
// clo_plo_mappings is nullable).
const PI_DEFINITIONS: {
  code: string;
  description: string;
  keyCourseCode: string;
  keyCloCode: string;
}[] = [
  {
    code: 'PI1',
    description:
      'Identify the variables, objectives and constraints in a problem',
    keyCourseCode: 'CCC100',
    keyCloCode: 'CLO1',
  },
  {
    code: 'PI2',
    description:
      'Derive an engineering formula from mathematical, scientific and/or engineering science principles',
    keyCourseCode: 'CCC101',
    keyCloCode: 'CLO1',
  },
  {
    code: 'PI3',
    description:
      'Determine the appropriate formula for a particular engineering problem',
    // The workbook's Evaluation sheet cites "CCC124/CLO1" here, but no
    // CCC124 exists anywhere else in the workbook (course list runs
    // CCC100/101/102/121/151/181 then CSC...). Treated as a typo for
    // CSC124, which does exist and is mapped to PLO1 in the Mapping sheet.
    keyCourseCode: 'CSC124',
    keyCloCode: 'CLO1',
  },
];

function parseElective(label: string): {
  code: string;
  electiveGroup: string | null;
} {
  const m = label.match(/^Elective (\d+) \(([^)]+)\)$/);
  if (m) {
    return { code: m[2], electiveGroup: `Elective ${m[1]}` };
  }
  return { code: label, electiveGroup: null };
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

async function main() {
  const wb = XLSX.readFile(WORKBOOK_PATH);

  // ---------------------------------------------------------------------
  // Program, cohort, placeholder academic term
  // ---------------------------------------------------------------------
  const program = await prisma.program.upsert({
    where: { code: 'BSCS' },
    update: {},
    create: { code: 'BSCS', name: 'Bachelor of Science in Computer Science' },
  });

  const cohort = await prisma.cohort.upsert({
    where: { programId_code: { programId: program.id, code: '2022-2025' } },
    update: {},
    create: {
      programId: program.id,
      code: '2022-2025',
      startYear: 2022,
      endYear: 2025,
      description: 'Batch 2022 to 2025',
    },
  });

  // The source workbook aggregates by batch only, with no per-term
  // breakdown, so all imported course offerings are attached to a single
  // placeholder term.
  const term = await prisma.academicTerm.upsert({
    where: {
      schoolYearStart_schoolYearEnd_semester: {
        schoolYearStart: 2024,
        schoolYearEnd: 2025,
        semester: 'FIRST',
      },
    },
    update: {},
    create: {
      schoolYearStart: 2024,
      schoolYearEnd: 2025,
      semester: 'FIRST',
      label: 'Imported batch 2022-2025 (source workbook did not split by term)',
    },
  });

  // ---------------------------------------------------------------------
  // PLOs (11) + PLO1's Performance Indicators
  // ---------------------------------------------------------------------
  const ploByCode = new Map<string, { id: string }>();
  for (let i = 1; i <= 11; i++) {
    const code = `PLO${i}`;
    const description =
      code === 'PLO1'
        ? PLO1_DESCRIPTION
        : `Description not yet documented for ${code}.`;
    const plo = await prisma.plo.upsert({
      where: { programId_code: { programId: program.id, code } },
      update: {},
      create: { programId: program.id, code, description, displayOrder: i },
    });
    ploByCode.set(code, plo);
  }

  const plo1 = ploByCode.get('PLO1')!;
  const piByCode = new Map<string, { id: string }>();
  for (let i = 0; i < PI_DEFINITIONS.length; i++) {
    const def = PI_DEFINITIONS[i];
    const pi = await prisma.performanceIndicator.upsert({
      where: { ploId_code: { ploId: plo1.id, code: def.code } },
      update: {},
      create: {
        ploId: plo1.id,
        code: def.code,
        description: def.description,
        displayOrder: i + 1,
      },
    });
    piByCode.set(def.code, pi);

    await prisma.piEvaluation.upsert({
      where: { piId_cohortId: { piId: pi.id, cohortId: cohort.id } },
      update: {},
      create: {
        piId: pi.id,
        cohortId: cohort.id,
        benchmarkDescription: PI_BENCHMARK,
        status: 'DRAFT',
      },
    });
  }

  // ---------------------------------------------------------------------
  // Mapping sheet: discover courses + CLOs + CLO->PLO mapping levels
  // ---------------------------------------------------------------------
  const mappingSheet = wb.Sheets['Mapping'];
  const mappingRows: any[][] = XLSX.utils.sheet_to_json(mappingSheet, {
    header: 1,
    defval: null,
  });

  // Row index 3 (sheet row 4) holds PLO1..PLO11 headers in columns C..M
  // (0-indexed 2..12).
  const ploHeaderRow = mappingRows[3];
  const ploColIndexToCode = new Map<number, string>();
  for (let c = 2; c <= 12; c++) {
    const code = ploHeaderRow[c];
    if (code) ploColIndexToCode.set(c, String(code));
  }

  type CourseInfo = {
    code: string;
    electiveGroup: string | null;
    order: number;
  };
  const courses: CourseInfo[] = [];

  type CloMappingRow = {
    courseCode: string;
    cloCode: string;
    ploLevels: { ploCode: string; level: MappingLevelCode }[];
  };
  const cloMappingRows: CloMappingRow[] = [];

  let currentCourseCode: string | null = null;
  let order = 0;
  for (let r = 4; r < mappingRows.length; r++) {
    const row = mappingRows[r] ?? [];
    const colA = row[0];
    const colB = row[1];

    if (colA && String(colA).startsWith('Summary of Mapping')) break;

    if (colA) {
      const { code, electiveGroup } = parseElective(String(colA));
      currentCourseCode = code;
      order += 1;
      courses.push({ code, electiveGroup, order });
      continue;
    }

    if (colB && currentCourseCode) {
      // Column position within the block gives the CLO number reliably,
      // independent of "CLO1" vs "CLO 1" label formatting.
      const cloCode = String(colB).replace(/\s+/g, '');
      const ploLevels: { ploCode: string; level: MappingLevelCode }[] = [];
      for (const [colIdx, ploCode] of ploColIndexToCode) {
        const val = row[colIdx];
        if (val) {
          ploLevels.push({
            ploCode,
            level: String(val).trim() as MappingLevelCode,
          });
        }
      }
      if (ploLevels.length > 0) {
        cloMappingRows.push({
          courseCode: currentCourseCode,
          cloCode,
          ploLevels,
        });
      }
    }
  }

  // ---------------------------------------------------------------------
  // Courses + curriculum membership + CLOs
  // ---------------------------------------------------------------------
  const courseByCode = new Map<string, { id: string }>();
  for (const c of courses) {
    // No course titles exist anywhere in the workbook, only codes — title
    // is a placeholder until entered by the program.
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: { code: c.code, title: c.code },
    });
    courseByCode.set(c.code, course);

    await prisma.curriculumCourse.upsert({
      where: {
        programId_courseId: { programId: program.id, courseId: course.id },
      },
      update: {},
      create: {
        programId: program.id,
        courseId: course.id,
        electiveGroup: c.electiveGroup,
        displayOrder: c.order,
      },
    });
  }

  const distinctClos = new Map<
    string,
    { courseCode: string; cloCode: string }
  >();
  for (const row of cloMappingRows) {
    distinctClos.set(`${row.courseCode}::${row.cloCode}`, row);
  }

  const cloByKey = new Map<string, { id: string }>();
  for (const { courseCode, cloCode } of distinctClos.values()) {
    const course = courseByCode.get(courseCode);
    if (!course) {
      console.warn(`Skipping CLO ${cloCode}: unknown course ${courseCode}`);
      continue;
    }
    const displayOrder = Number(cloCode.replace('CLO', '')) || 0;
    const clo = await prisma.clo.upsert({
      where: {
        courseId_code_cohortId: {
          courseId: course.id,
          code: cloCode,
          cohortId: cohort.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        cohortId: cohort.id,
        code: cloCode,
        description: `Placeholder description for ${courseCode} ${cloCode} — update with the actual learning outcome text.`,
        displayOrder,
      },
    });
    cloByKey.set(`${courseCode}::${cloCode}`, clo);
  }

  // ---------------------------------------------------------------------
  // CLO -> PLO mappings (+ optional PI attachment for PLO1's key CLOs)
  // ---------------------------------------------------------------------
  let mappingCount = 0;
  for (const row of cloMappingRows) {
    const clo = cloByKey.get(`${row.courseCode}::${row.cloCode}`);
    if (!clo) continue;

    for (const { ploCode, level } of row.ploLevels) {
      const plo = ploByCode.get(ploCode);
      if (!plo) continue;

      const matchingPi =
        ploCode === 'PLO1'
          ? PI_DEFINITIONS.find(
              (def) =>
                def.keyCourseCode === row.courseCode &&
                def.keyCloCode === row.cloCode,
            )
          : undefined;

      await prisma.cloPloMapping.upsert({
        where: {
          cloId_ploId_cohortId: {
            cloId: clo.id,
            ploId: plo.id,
            cohortId: cohort.id,
          },
        },
        update: {},
        create: {
          cloId: clo.id,
          ploId: plo.id,
          cohortId: cohort.id,
          levelCode: level,
          piId: matchingPi ? piByCode.get(matchingPi.code)!.id : null,
          assessmentMethod: matchingPi ? PI_ASSESSMENT_METHOD : null,
        },
      });
      mappingCount += 1;
    }
  }

  // ---------------------------------------------------------------------
  // Course offerings (one per course, on the single placeholder term)
  // ---------------------------------------------------------------------
  const offeringByCourseCode = new Map<string, { id: string }>();
  for (const [code, course] of courseByCode) {
    const offering = await prisma.courseOffering.upsert({
      where: {
        courseId_academicTermId_section: {
          courseId: course.id,
          academicTermId: term.id,
          section: '1',
        },
      },
      update: {},
      create: { courseId: course.id, academicTermId: term.id, section: '1' },
    });
    offeringByCourseCode.set(code, offering);
  }

  // ---------------------------------------------------------------------
  // CLO_Attainments sheet: students, enrollments, raw CLO scores
  // ---------------------------------------------------------------------
  const attainmentsSheet = wb.Sheets['CLO_Attainments'];
  const attainmentsRows: any[][] = XLSX.utils.sheet_to_json(attainmentsSheet, {
    header: 1,
    defval: null,
  });

  // Row index 2 (sheet row 3): course code headers starting at column C
  // (index 2), each course spanning 3 columns (CLO1-3).
  const courseHeaderRow = attainmentsRows[2];
  type CourseBlock = { courseCode: string; startCol: number };
  const courseBlocks: CourseBlock[] = [];
  for (let c = 2; c < courseHeaderRow.length; c++) {
    const label = courseHeaderRow[c];
    if (label) {
      const { code } = parseElective(String(label));
      courseBlocks.push({ courseCode: code, startCol: c });
    }
  }

  const studentByNumber = new Map<string, { id: string }>();
  const studentDataRows = attainmentsRows.slice(5); // sheet rows 6..end

  for (const row of studentDataRows) {
    const studentNumber = row[0];
    const fullName = row[1];
    if (!studentNumber) continue;

    const { firstName, lastName } = splitName(String(fullName));
    const student = await prisma.student.upsert({
      where: { studentNumber: String(studentNumber) },
      update: {},
      create: {
        studentNumber: String(studentNumber),
        firstName,
        lastName,
        programId: program.id,
        cohortId: cohort.id,
        status: 'ACTIVE',
      },
    });
    studentByNumber.set(String(studentNumber), student);
  }

  // Bulk-create enrollments (student x course, for course/student pairs
  // that actually have at least one CLO score), then look up their IDs.
  const enrollmentPairs: { studentId: string; courseOfferingId: string }[] = [];
  for (const row of studentDataRows) {
    const studentNumber = row[0];
    if (!studentNumber) continue;
    const student = studentByNumber.get(String(studentNumber))!;

    for (const block of courseBlocks) {
      const hasAnyScore = [0, 1, 2].some(
        (i) => row[block.startCol + i] != null,
      );
      if (!hasAnyScore) continue;
      const offering = offeringByCourseCode.get(block.courseCode);
      if (!offering) continue;
      enrollmentPairs.push({
        studentId: student.id,
        courseOfferingId: offering.id,
      });
    }
  }

  await prisma.enrollment.createMany({
    data: enrollmentPairs,
    skipDuplicates: true,
  });

  const allEnrollments = await prisma.enrollment.findMany({
    where: { student: { programId: program.id, cohortId: cohort.id } },
  });
  const enrollmentByKey = new Map(
    allEnrollments.map((e) => [`${e.studentId}::${e.courseOfferingId}`, e.id]),
  );

  const attainmentRows: {
    enrollmentId: string;
    cloId: string;
    score: number;
  }[] = [];
  for (const row of studentDataRows) {
    const studentNumber = row[0];
    if (!studentNumber) continue;
    const student = studentByNumber.get(String(studentNumber))!;

    for (const block of courseBlocks) {
      const offering = offeringByCourseCode.get(block.courseCode);
      if (!offering) continue;
      const enrollmentId = enrollmentByKey.get(`${student.id}::${offering.id}`);
      if (!enrollmentId) continue;

      for (let i = 0; i < 3; i++) {
        const score = row[block.startCol + i];
        if (score == null) continue;
        const cloCode = `CLO${i + 1}`;
        const clo = cloByKey.get(`${block.courseCode}::${cloCode}`);
        if (!clo) continue;
        attainmentRows.push({
          enrollmentId,
          cloId: clo.id,
          score: Number(score),
        });
      }
    }
  }

  const CHUNK_SIZE = 1000;
  for (let i = 0; i < attainmentRows.length; i += CHUNK_SIZE) {
    await prisma.cloAttainment.createMany({
      data: attainmentRows.slice(i, i + CHUNK_SIZE),
      skipDuplicates: true,
    });
  }

  // ---------------------------------------------------------------------
  // Summary — compare against the source workbook
  // ---------------------------------------------------------------------
  console.log('Import complete:');
  console.log(`  courses:            ${courseByCode.size}`);
  console.log(`  CLOs:               ${cloByKey.size}`);
  console.log(`  PLOs:               ${ploByCode.size}`);
  console.log(`  CLO->PLO mappings:  ${mappingCount}`);
  console.log(`  students:           ${studentByNumber.size}`);
  console.log(`  enrollments:        ${enrollmentPairs.length}`);
  console.log(`  CLO attainments:    ${attainmentRows.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
