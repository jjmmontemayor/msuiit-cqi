import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAttainmentBenchmarkDto } from './dto/update-attainment-benchmark.dto';

@Injectable()
export class AttainmentBenchmarkService {
  constructor(private readonly prisma: PrismaService) {}

  // One row per program -- created alongside the program (see
  // ProgramsService.create), but fall back to creating it if it's ever
  // missing (e.g. a program created before this table existed).
  async get(programId: string) {
    const existing = await this.prisma.attainmentBenchmark.findUnique({
      where: { programId },
    });
    if (existing) return existing;
    return this.prisma.attainmentBenchmark.create({
      data: { programId, percentage: 70 },
    });
  }

  async update(programId: string, dto: UpdateAttainmentBenchmarkDto) {
    const current = await this.get(programId);
    return this.prisma.attainmentBenchmark.update({
      where: { id: current.id },
      data: dto,
    });
  }
}
