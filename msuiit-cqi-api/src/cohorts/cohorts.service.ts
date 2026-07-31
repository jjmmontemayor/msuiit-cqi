import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';

@Injectable()
export class CohortsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCohortDto) {
    return this.prisma.cohort.create({ data: dto });
  }

  findAll(programId?: string) {
    return this.prisma.cohort.findMany({
      where: programId ? { programId } : undefined,
      orderBy: { startYear: 'desc' },
    });
  }

  async findOne(id: string) {
    const cohort = await this.prisma.cohort.findUnique({ where: { id } });
    if (!cohort) {
      throw new NotFoundException(`Cohort ${id} not found`);
    }
    return cohort;
  }

  async update(id: string, dto: UpdateCohortDto) {
    await this.findOne(id);
    return this.prisma.cohort.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cohort.delete({ where: { id } });
  }
}
