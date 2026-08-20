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

  // CLOs are curriculum-version-scoped (a course can have a different CLO
  // set per curriculum revision). Callers that are editing curriculum
  // definition (the mapping pages, the admin CLO editor) pass
  // curriculumVersionId directly. Callers that only know a cohort/batch
  // (report pages, the public course view) pass cohortId instead, which is
  // resolved to that cohort's assigned version -- a cohort with no version
  // assigned yet has no CLOs to show. With neither given, falls back to the
  // most recently created curriculum version so there's still a single
  // coherent set instead of every version's CLOs merged together.
  private async resolveCloWhere(params: {
    curriculumVersionId?: string;
    cohortId?: string;
  }) {
    let curriculumVersionId = params.curriculumVersionId;
    if (!curriculumVersionId && params.cohortId) {
      const cohort = await this.prisma.cohort.findUnique({
        where: { id: params.cohortId },
      });
      curriculumVersionId = cohort?.curriculumVersionId ?? '__none__';
    }
    if (curriculumVersionId) {
      return { curriculumVersionId };
    }
    const latestVersion = await this.prisma.curriculumVersion.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return latestVersion
      ? { curriculumVersionId: latestVersion.id }
      : { curriculumVersionId: '__none__' };
  }

  async findAll(
    programId?: string,
    cohortId?: string,
    curriculumVersionId?: string,
  ) {
    const cloWhere = await this.resolveCloWhere({
      curriculumVersionId,
      cohortId,
    });
    return this.prisma.course.findMany({
      where: programId
        ? { curriculumCourses: { some: { programId } } }
        : undefined,
      orderBy: { code: 'asc' },
      include: { clos: { where: cloWhere, orderBy: { displayOrder: 'asc' } } },
    });
  }

  async findOne(id: string, cohortId?: string, curriculumVersionId?: string) {
    const cloWhere = await this.resolveCloWhere({
      curriculumVersionId,
      cohortId,
    });
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
