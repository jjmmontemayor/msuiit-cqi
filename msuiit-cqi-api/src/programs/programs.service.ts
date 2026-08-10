import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

const DEFAULT_MAPPING_LEVELS = [
  { code: 'I' as const, label: 'Introduced', weight: 1 },
  { code: 'P' as const, label: 'Practiced', weight: 2 },
  { code: 'D' as const, label: 'Demonstrated', weight: 3 },
];

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProgramDto) {
    return this.prisma.$transaction(async (tx) => {
      const program = await tx.program.create({ data: dto });
      await tx.mappingLevel.createMany({
        data: DEFAULT_MAPPING_LEVELS.map((level) => ({
          programId: program.id,
          ...level,
        })),
      });
      await tx.attainmentBenchmark.create({
        data: { programId: program.id, percentage: 70 },
      });
      return program;
    });
  }

  findAll() {
    return this.prisma.program.findMany({ orderBy: { code: 'asc' } });
  }

  async findOne(id: string) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) {
      throw new NotFoundException(`Program ${id} not found`);
    }
    return program;
  }

  async update(id: string, dto: UpdateProgramDto) {
    await this.findOne(id);
    return this.prisma.program.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.program.delete({ where: { id } });
  }
}
