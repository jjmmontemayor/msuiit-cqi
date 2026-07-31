import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseOfferingDto } from './dto/create-course-offering.dto';
import { UpdateCourseOfferingDto } from './dto/update-course-offering.dto';

@Injectable()
export class CourseOfferingsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCourseOfferingDto) {
    return this.prisma.courseOffering.create({ data: dto });
  }

  findAll(params: { courseId?: string; academicTermId?: string }) {
    return this.prisma.courseOffering.findMany({
      where: {
        courseId: params.courseId,
        academicTermId: params.academicTermId,
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
    return this.prisma.courseOffering.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.courseOffering.delete({ where: { id } });
  }
}
