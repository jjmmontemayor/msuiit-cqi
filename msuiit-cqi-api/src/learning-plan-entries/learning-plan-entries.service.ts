import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLearningPlanEntryDto } from './dto/create-learning-plan-entry.dto';
import { UpdateLearningPlanEntryDto } from './dto/update-learning-plan-entry.dto';

@Injectable()
export class LearningPlanEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateLearningPlanEntryDto) {
    return this.prisma.learningPlanEntry.create({ data: dto });
  }

  findAll(courseOfferingId?: string) {
    return this.prisma.learningPlanEntry.findMany({
      where: courseOfferingId ? { courseOfferingId } : undefined,
      orderBy: [{ courseOfferingId: 'asc' }, { displayOrder: 'asc' }],
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.learningPlanEntry.findUnique({
      where: { id },
    });
    if (!entry) {
      throw new NotFoundException(`Learning plan entry ${id} not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateLearningPlanEntryDto) {
    await this.findOne(id);
    return this.prisma.learningPlanEntry.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.learningPlanEntry.delete({ where: { id } });
  }
}
