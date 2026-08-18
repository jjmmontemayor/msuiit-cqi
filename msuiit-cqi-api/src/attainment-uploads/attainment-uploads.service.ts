import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { UploadAttainmentSheetDto } from './dto/upload-attainment-sheet.dto';

const CLO_CODES = ['CLO1', 'CLO2', 'CLO3'] as const;

// Same course-label parsing as the original workbook import: "Elective N
// (CODE)" columns store the actual course code in parens.
function parseElective(label: string): { code: string } {
  const m = label.match(/^Elective (\d+) \(([^)]+)\)$/);
  return m ? { code: m[2] } : { code: label };
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

@Injectable()
export class AttainmentUploadsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(
    file: Express.Multer.File,
    dto: UploadAttainmentSheetDto,
  ): Promise<AttainmentUploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(file.buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException(
        'Could not read the uploaded file as an Excel workbook.',
      );
    }

    const sheet = wb.Sheets['CLO_Attainments'] ?? wb.Sheets[wb.SheetNames[0]];
    if (!sheet) {
      throw new BadRequestException('The uploaded workbook has no sheets.');
    }

    // Same layout as the source CLO_Attainments sheet: row index 2 is the
    // course header row (course codes starting at column C, each spanning
    // 3 columns for CLO1-3), and student data starts at row index 5.
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });
    const courseHeaderRow = rows[2] ?? [];
    const courseBlocks: { courseCode: string; startCol: number }[] = [];
    for (let c = 2; c < courseHeaderRow.length; c++) {
      const label = courseHeaderRow[c];
      if (label) {
        const { code } = parseElective(String(label));
        courseBlocks.push({ courseCode: code, startCol: c });
      }
    }
    if (courseBlocks.length === 0) {
      throw new BadRequestException(
        'No course columns found in row 3 of the sheet — expected the same layout as the CLO_Attainments sheet.',
      );
    }
    const studentDataRows = rows.slice(5).filter((row) => row[0] != null);

    return this.prisma.$transaction(async (tx) => {
      // Resolve the academic term for this upload -- a lookup against
      // terms an admin has already set up, never a create. The faculty
      // uploading only picks a semester + academic year.
      let academicTermId = dto.academicTermId;
      if (
        !academicTermId &&
        dto.schoolYearStart != null &&
        dto.schoolYearEnd != null &&
        dto.semester
      ) {
        const term = await tx.academicTerm.findUnique({
          where: {
            schoolYearStart_schoolYearEnd_semester: {
              schoolYearStart: dto.schoolYearStart,
              schoolYearEnd: dto.schoolYearEnd,
              semester: dto.semester,
            },
          },
        });
        if (!term) {
          throw new BadRequestException(
            `No academic term found for ${dto.schoolYearStart}-${dto.schoolYearEnd} ${dto.semester} — ask an admin to add it first.`,
          );
        }
        academicTermId = term.id;
      }
      if (!academicTermId) {
        throw new BadRequestException('Select an academic year and semester.');
      }
      const section = dto.section || 'Upload';

      // Match course columns against existing courses -- never auto-create
      // courses from an upload.
      const matchedCourses = await tx.course.findMany({
        where: { code: { in: courseBlocks.map((b) => b.courseCode) } },
      });
      const courseByCode = new Map(matchedCourses.map((c) => [c.code, c]));
      const skippedCourseCodes = courseBlocks
        .map((b) => b.courseCode)
        .filter((code) => !courseByCode.has(code));

      // One CourseOffering per matched course for this term/section.
      const offeringByCourseId = new Map<string, { id: string }>();
      for (const course of matchedCourses) {
        const offering = await tx.courseOffering.upsert({
          where: {
            courseId_academicTermId_section: {
              courseId: course.id,
              academicTermId,
              section,
            },
          },
          update: {},
          create: { courseId: course.id, academicTermId, section },
        });
        offeringByCourseId.set(course.id, offering);
      }

      // Cache resolved CLOs per (courseId, code) -- prefer the cohort the
      // student belongs to; fall back to the most recent cohort's version
      // of that CLO when the student has no cohort (out-of-program) or
      // that cohort has no CLO of this code.
      const cloCache = new Map<string, { id: string } | null>();
      async function resolveClo(
        courseId: string,
        code: string,
        cohortId: string | null,
      ) {
        const cacheKey = `${courseId}::${code}::${cohortId ?? ''}`;
        if (cloCache.has(cacheKey)) return cloCache.get(cacheKey)!;

        let clo: { id: string } | null = null;
        if (cohortId) {
          clo = await tx.clo.findUnique({
            where: { courseId_code_cohortId: { courseId, code, cohortId } },
          });
        }
        if (!clo) {
          clo = await tx.clo.findFirst({
            where: { courseId, code },
            orderBy: { cohort: { startYear: 'desc' } },
          });
        }
        cloCache.set(cacheKey, clo);
        return clo;
      }

      let studentsCreated = 0;
      let studentsExistingInProgram = 0;
      let studentsExistingOutOfProgram = 0;
      let enrollmentsRecorded = 0;
      let attainmentsRecorded = 0;
      let attainmentsSkippedNoClo = 0;

      for (const row of studentDataRows) {
        const studentNumber = String(row[0]);
        const fullName = row[1] != null ? String(row[1]) : studentNumber;

        let student = await tx.student.findUnique({ where: { studentNumber } });
        if (!student) {
          const { firstName, lastName } = splitName(fullName);
          student = await tx.student.create({
            data: {
              studentNumber,
              firstName,
              lastName,
              programId: dto.programId,
              cohortId: null,
            },
          });
          studentsCreated += 1;
        } else if (student.programId === dto.programId && student.cohortId) {
          studentsExistingInProgram += 1;
        } else {
          studentsExistingOutOfProgram += 1;
        }

        for (const block of courseBlocks) {
          const course = courseByCode.get(block.courseCode);
          if (!course) continue;
          const offering = offeringByCourseId.get(course.id)!;

          const scoresInBlock = CLO_CODES.map(
            (_, i) => row[block.startCol + i],
          );
          const hasAnyScore = scoresInBlock.some((s) => s != null);
          if (!hasAnyScore) continue;

          const enrollment = await tx.enrollment.upsert({
            where: {
              studentId_courseOfferingId: {
                studentId: student.id,
                courseOfferingId: offering.id,
              },
            },
            update: {},
            create: {
              studentId: student.id,
              courseOfferingId: offering.id,
            },
          });
          enrollmentsRecorded += 1;

          for (let i = 0; i < CLO_CODES.length; i++) {
            const score = row[block.startCol + i];
            if (score == null) continue;
            const clo = await resolveClo(
              course.id,
              CLO_CODES[i],
              student.cohortId,
            );
            if (!clo) {
              attainmentsSkippedNoClo += 1;
              continue;
            }
            await tx.cloAttainment.upsert({
              where: {
                enrollmentId_cloId: {
                  enrollmentId: enrollment.id,
                  cloId: clo.id,
                },
              },
              update: { score: Number(score) },
              create: {
                enrollmentId: enrollment.id,
                cloId: clo.id,
                score: Number(score),
              },
            });
            attainmentsRecorded += 1;
          }
        }
      }

      return {
        coursesMatched: matchedCourses.map((c) => c.code),
        coursesSkipped: skippedCourseCodes,
        studentsCreated,
        studentsExistingInProgram,
        studentsExistingOutOfProgram,
        enrollmentsRecorded,
        attainmentsRecorded,
        attainmentsSkippedNoClo,
      };
    });
  }
}
