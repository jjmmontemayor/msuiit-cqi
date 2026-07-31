import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerformanceIndicatorDto } from './dto/create-performance-indicator.dto';
import { UpdatePerformanceIndicatorDto } from './dto/update-performance-indicator.dto';

@Injectable()
export class PerformanceIndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePerformanceIndicatorDto) {
    return this.prisma.performanceIndicator.create({ data: dto });
  }

  findAll(ploId?: string) {
    return this.prisma.performanceIndicator.findMany({
      where: ploId ? { ploId } : undefined,
      orderBy: [{ ploId: 'asc' }, { displayOrder: 'asc' }],
    });
  }

  async findOne(id: string) {
    const pi = await this.prisma.performanceIndicator.findUnique({
      where: { id },
    });
    if (!pi) {
      throw new NotFoundException(`Performance indicator ${id} not found`);
    }
    return pi;
  }

  async update(id: string, dto: UpdatePerformanceIndicatorDto) {
    await this.findOne(id);
    return this.prisma.performanceIndicator.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.performanceIndicator.delete({ where: { id } });
  }
}
