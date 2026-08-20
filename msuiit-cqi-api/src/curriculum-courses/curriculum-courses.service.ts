import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumCourseDto } from './dto/create-curriculum-course.dto';
import { UpdateCurriculumCourseDto } from './dto/update-curriculum-course.dto';

@Injectable()
export class CurriculumCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // CLOs are curriculum-version-scoped; nested course.clos here is only used
  // for display (e.g. a "N CLOs" count), so it's always narrowed to the most
  // recently created version rather than every version's CLOs merged
  // together.
  private async latestCloWhere() {
    const latestVersion = await this.prisma.curriculumVersion.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return latestVersion
      ? { curriculumVersionId: latestVersion.id }
      : { curriculumVersionId: '__none__' };
  }

  async create(dto: CreateCurriculumCourseDto) {
    const cloWhere = await this.latestCloWhere();
    return this.prisma.curriculumCourse.create({
      data: dto,
      include: { course: { include: { clos: { where: cloWhere } } } },
    });
  }

  async findAll(programId?: string) {
    const cloWhere = await this.latestCloWhere();
    return this.prisma.curriculumCourse.findMany({
      where: programId ? { programId } : undefined,
      orderBy: [{ yearLevel: 'asc' }, { displayOrder: 'asc' }],
      include: {
        course: {
          include: {
            clos: { where: cloWhere, orderBy: { displayOrder: 'asc' } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const cloWhere = await this.latestCloWhere();
    const curriculumCourse = await this.prisma.curriculumCourse.findUnique({
      where: { id },
      include: { course: { include: { clos: { where: cloWhere } } } },
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
