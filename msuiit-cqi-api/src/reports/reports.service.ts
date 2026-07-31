import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  cloAttainmentByCourse(courseId?: string) {
    if (courseId) {
      return this.prisma.$queryRaw(
        Prisma.sql`SELECT * FROM v_clo_attainment_by_course WHERE course_id = ${courseId}::uuid ORDER BY clo_code`,
      );
    }
    return this.prisma.$queryRaw(
      Prisma.sql`SELECT * FROM v_clo_attainment_by_course ORDER BY course_code, clo_code`,
    );
  }

  ploAttainmentByCourse(courseId?: string) {
    if (courseId) {
      return this.prisma.$queryRaw(
        Prisma.sql`SELECT * FROM v_plo_attainment_by_course WHERE course_id = ${courseId}::uuid ORDER BY plo_code`,
      );
    }
    return this.prisma.$queryRaw(
      Prisma.sql`SELECT * FROM v_plo_attainment_by_course ORDER BY course_code, plo_code`,
    );
  }

  ploAttainmentByStudent(studentId?: string) {
    if (studentId) {
      return this.prisma.$queryRaw(
        Prisma.sql`SELECT * FROM v_plo_attainment_by_student WHERE student_id = ${studentId}::uuid ORDER BY plo_code`,
      );
    }
    return this.prisma.$queryRaw(
      Prisma.sql`SELECT * FROM v_plo_attainment_by_student ORDER BY student_number, plo_code`,
    );
  }

  programPloPerformance(programId?: string) {
    if (programId) {
      return this.prisma.$queryRaw(
        Prisma.sql`SELECT * FROM v_program_plo_performance WHERE program_id = ${programId}::uuid ORDER BY plo_code`,
      );
    }
    return this.prisma.$queryRaw(
      Prisma.sql`SELECT * FROM v_program_plo_performance ORDER BY program_id, plo_code`,
    );
  }
}
