import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEnrollmentDto) {
    return this.prisma.enrollment.create({ data: dto });
  }

  findAll(params: { studentId?: string; courseOfferingId?: string }) {
    return this.prisma.enrollment.findMany({
      where: {
        studentId: params.studentId,
        courseOfferingId: params.courseOfferingId,
      },
      include: { student: true, courseOffering: { include: { course: true } } },
    });
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: { student: true, courseOffering: { include: { course: true } } },
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${id} not found`);
    }
    return enrollment;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.enrollment.delete({ where: { id } });
  }
}
