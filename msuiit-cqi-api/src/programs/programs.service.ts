import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

const DEFAULT_MAPPING_LEVELS = [
  { code: 'I', displayCode: 'I', label: 'Introduced', weight: 1 },
  { code: 'P', displayCode: 'P', label: 'Practiced', weight: 2 },
  { code: 'D', displayCode: 'D', label: 'Demonstrated', weight: 3 },
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

  async findOne(idOrCode: string) {
    const program = await this.prisma.program.findFirst({
      where: { OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!program) {
      throw new NotFoundException(`Program ${idOrCode} not found`);
    }
    return program;
  }

  async update(idOrCode: string, dto: UpdateProgramDto) {
    const program = await this.findOne(idOrCode);
    return this.prisma.program.update({ where: { id: program.id }, data: dto });
  }

  async remove(idOrCode: string) {
    const program = await this.findOne(idOrCode);
    return this.prisma.program.delete({ where: { id: program.id } });
  }
}
