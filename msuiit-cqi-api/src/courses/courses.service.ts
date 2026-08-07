import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  // CLOs are cohort-scoped (a course can have a different CLO set per
  // batch). Callers that care which batch they're looking at pass
  // cohortId explicitly (the mapping pages, the admin CLO editor); callers
  // that don't (report pages, the public course view) get the most recent
  // cohort's CLOs by default so they still see a single coherent set
  // instead of every batch's CLOs merged together.
  private async resolveCloWhere(cohortId?: string) {
    if (cohortId) {
      return { cohortId };
    }
    const latestCohort = await this.prisma.cohort.findFirst({
      orderBy: { startYear: 'desc' },
    });
    return latestCohort ? { cohortId: latestCohort.id } : { cohortId: '__none__' };
  }

  async findAll(programId?: string, cohortId?: string) {
    const cloWhere = await this.resolveCloWhere(cohortId);
    return this.prisma.course.findMany({
      where: programId
        ? { curriculumCourses: { some: { programId } } }
        : undefined,
      orderBy: { code: 'asc' },
      include: { clos: { where: cloWhere, orderBy: { displayOrder: 'asc' } } },
    });
  }

  async findOne(id: string, cohortId?: string) {
    const cloWhere = await this.resolveCloWhere(cohortId);
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { clos: { where: cloWhere, orderBy: { displayOrder: 'asc' } } },
    });
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.course.delete({ where: { id } });
  }
}
