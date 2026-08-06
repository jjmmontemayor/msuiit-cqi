import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumCourseDto } from './dto/create-curriculum-course.dto';
import { UpdateCurriculumCourseDto } from './dto/update-curriculum-course.dto';

@Injectable()
export class CurriculumCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCurriculumCourseDto) {
    return this.prisma.curriculumCourse.create({
      data: dto,
      include: { course: { include: { clos: true } } },
    });
  }

  findAll(programId?: string) {
    return this.prisma.curriculumCourse.findMany({
      where: programId ? { programId } : undefined,
      orderBy: [{ yearLevel: 'asc' }, { displayOrder: 'asc' }],
      include: { course: { include: { clos: { orderBy: { displayOrder: 'asc' } } } } },
    });
  }

  async findOne(id: string) {
    const curriculumCourse = await this.prisma.curriculumCourse.findUnique({
      where: { id },
      include: { course: { include: { clos: true } } },
    });
    if (!curriculumCourse) {
      throw new NotFoundException(`Curriculum course ${id} not found`);
    }
    return curriculumCourse;
  }

  async update(id: string, dto: UpdateCurriculumCourseDto) {
    await this.findOne(id);
    return this.prisma.curriculumCourse.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.curriculumCourse.delete({ where: { id } });
  }
}
