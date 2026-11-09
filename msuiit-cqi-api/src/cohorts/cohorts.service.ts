import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { parseStudentList } from './student-list.parser';

export interface StudentImportResult {
  totalRows: number;
  created: number;
  assignedExisting: number;
  alreadyInCohort: number;
  skippedOtherCohort: string[];
  skippedOtherProgram: string[];
  invalidRows: number;
}

@Injectable()
export class CohortsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCohortDto) {
    return this.prisma.cohort.create({ data: dto });
  }

  findAll(programId?: string) {
    return this.prisma.cohort.findMany({
      where: programId ? { programId } : undefined,
      orderBy: { startYear: 'desc' },
    });
  }

  async findOne(id: string) {
    const cohort = await this.prisma.cohort.findUnique({ where: { id } });
    if (!cohort) {
      throw new NotFoundException(`Cohort ${id} not found`);
    }
    return cohort;
  }

  async update(id: string, dto: UpdateCohortDto) {
    await this.findOne(id);
    return this.prisma.cohort.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cohort.delete({ where: { id } });
  }

  // Initializes a cohort's student list from an Excel / CSV file. Existing
  // students are never moved out of another cohort or program.
  async importStudents(
    cohortId: string,
    file: Express.Multer.File | undefined,
  ): Promise<StudentImportResult> {
    if (!file) throw new BadRequestException('No file uploaded.');
    const cohort = await this.findOne(cohortId);

    let parsed;
    try {
      parsed = parseStudentList(file.buffer);
    } catch {
      throw new BadRequestException(
        'Could not read the uploaded file as an Excel or CSV student list.',
      );
    }
    if (parsed.students.length === 0) {
      throw new BadRequestException(
        'No students found. Expected a student number column and a name column (or first and last name columns).',
      );
    }

    const existing = await this.prisma.student.findMany({
      where: { studentNumber: { in: parsed.students.map((s) => s.studentNumber) } },
    });
    const byNumber = new Map(existing.map((s) => [s.studentNumber, s]));

    const toCreate: Prisma.StudentCreateManyInput[] = [];
    const toAssign: string[] = [];
    const result: StudentImportResult = {
      totalRows: parsed.students.length,
      created: 0,
      assignedExisting: 0,
      alreadyInCohort: 0,
      skippedOtherCohort: [],
      skippedOtherProgram: [],
      invalidRows: parsed.invalidRows,
    };

    for (const s of parsed.students) {
      const found = byNumber.get(s.studentNumber);
      if (!found) {
        toCreate.push({ ...s, programId: cohort.programId, cohortId });
      } else if (found.programId !== cohort.programId) {
        result.skippedOtherProgram.push(s.studentNumber);
      } else if (found.cohortId === cohortId) {
        result.alreadyInCohort++;
      } else if (found.cohortId) {
        result.skippedOtherCohort.push(s.studentNumber);
      } else {
        toAssign.push(found.id);
      }
    }

    await this.prisma.$transaction([
      this.prisma.student.createMany({ data: toCreate, skipDuplicates: true }),
      this.prisma.student.updateMany({
        where: { id: { in: toAssign } },
        data: { cohortId },
      }),
    ]);
    result.created = toCreate.length;
    result.assignedExisting = toAssign.length;
    return result;
  }
}
