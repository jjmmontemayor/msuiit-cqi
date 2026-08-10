import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCohortAdviserDto } from './dto/create-cohort-adviser.dto';

@Injectable()
export class CohortAdvisersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCohortAdviserDto) {
    return this.prisma.cohortAdviser.create({
      data: dto,
      include: { faculty: true },
    });
  }

  findAll(cohortId?: string) {
    return this.prisma.cohortAdviser.findMany({
      where: cohortId ? { cohortId } : undefined,
      include: { faculty: true },
      orderBy: { faculty: { name: 'asc' } },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.cohortAdviser.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Cohort adviser ${id} not found`);
    }
    return this.prisma.cohortAdviser.delete({ where: { id } });
  }
}
