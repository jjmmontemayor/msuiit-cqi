import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseOfferingDto } from './dto/create-course-offering.dto';
import { UpdateCourseOfferingDto } from './dto/update-course-offering.dto';

// A null grade scale clears the override (JSON columns need an explicit DbNull).
function toData<T extends { gradeScale?: unknown; archived?: boolean }>(dto: T) {
  const { gradeScale, archived, ...rest } = dto;
  return {
    ...rest,
    ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }),
    ...(gradeScale === undefined
      ? {}
      : { gradeScale: gradeScale === null ? Prisma.DbNull : (gradeScale as Prisma.InputJsonValue) }),
  };
}

@Injectable()
export class CourseOfferingsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCourseOfferingDto) {
    return this.prisma.courseOffering.create({ data: toData(dto) });
  }

  // archived: 'exclude' (default), 'include' or 'only'.
  findAll(params: {
    courseId?: string;
    academicTermId?: string;
    archived?: string;
  }) {
    return this.prisma.courseOffering.findMany({
      where: {
        courseId: params.courseId,
        academicTermId: params.academicTermId,
        archivedAt:
          params.archived === 'include'
            ? undefined
            : params.archived === 'only'
              ? { not: null }
              : null,
      },
      include: { course: true, academicTerm: true },
    });
  }

  async findOne(id: string) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id },
      include: { course: true, academicTerm: true },
    });
    if (!offering) {
      throw new NotFoundException(`Course offering ${id} not found`);
    }
    return offering;
  }

  async update(id: string, dto: UpdateCourseOfferingDto) {
    await this.findOne(id);
    return this.prisma.courseOffering.update({ where: { id }, data: toData(dto) });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.courseOffering.delete({ where: { id } });
  }
}
