import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  cloAttainmentByCourse(courseId?: string) {
    if (courseId) {
      return this.prisma.$queryRaw(
        Prisma.sql`SELECT * FROM v_clo_attainment_by_course WHERE course_id = ${courseId} ORDER BY clo_code`,
      );
    }
    return this.prisma.$queryRaw(
      Prisma.sql`SELECT * FROM v_clo_attainment_by_course ORDER BY course_code, clo_code`,
    );
  }

  ploAttainmentByCourse(params: { courseId?: string; cohortId?: string }) {
    const conditions: Prisma.Sql[] = [];
    if (params.courseId) {
      conditions.push(Prisma.sql`course_id = ${params.courseId}`);
    }
    if (params.cohortId) {
      conditions.push(Prisma.sql`cohort_id = ${params.cohortId}`);
    }
    const where =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    return this.prisma.$queryRaw(
      Prisma.sql`SELECT * FROM v_plo_attainment_by_course ${where} ORDER BY course_code, plo_code`,
    );
  }

  ploAttainmentByStudent(studentId?: string) {
    if (studentId) {
      return this.prisma.$queryRaw(
        Prisma.sql`SELECT * FROM v_plo_attainment_by_student WHERE student_id = ${studentId} ORDER BY plo_code`,
      );
    }
    return this.prisma.$queryRaw(
      Prisma.sql`SELECT * FROM v_plo_attainment_by_student ORDER BY student_number, plo_code`,
    );
  }

  cloAttainmentByStudent(studentId: string) {
    return this.prisma.$queryRaw(
      Prisma.sql`
        SELECT
            c.id            AS course_id,
            c.code          AS course_code,
            clo.id          AS clo_id,
            clo.code        AS clo_code,
            ca.score        AS score
        FROM clo_attainments ca
        JOIN clos clo             ON clo.id = ca.clo_id
        JOIN enrollments e        ON e.id = ca.enrollment_id
        JOIN course_offerings co  ON co.id = e.course_offering_id
        JOIN courses c            ON c.id = co.course_id
        WHERE e.student_id = ${studentId}
        ORDER BY c.code, clo.code
      `,
    );
  }

  programPloPerformance(params: { programId?: string; cohortId?: string }) {
    const conditions: Prisma.Sql[] = [];
    if (params.programId) {
      conditions.push(Prisma.sql`program_id = ${params.programId}`);
    }
    if (params.cohortId) {
      conditions.push(Prisma.sql`cohort_id = ${params.cohortId}`);
    }
    const where =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    return this.prisma.$queryRaw(
      Prisma.sql`SELECT * FROM v_program_plo_performance ${where} ORDER BY program_id, plo_code`,
    );
  }
}
