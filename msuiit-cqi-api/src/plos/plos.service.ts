import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePloDto } from './dto/create-plo.dto';
import { UpdatePloDto } from './dto/update-plo.dto';

@Injectable()
export class PlosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePloDto) {
    return this.prisma.plo.create({ data: dto });
  }

  findAll(programId?: string) {
    return this.prisma.plo.findMany({
      where: programId ? { programId } : undefined,
      orderBy: [{ programId: 'asc' }, { displayOrder: 'asc' }],
      include: {
        performanceIndicators: { orderBy: { displayOrder: 'asc' } },
      },
    });
  }

  async findOne(id: string) {
    const plo = await this.prisma.plo.findUnique({
      where: { id },
      include: {
        performanceIndicators: { orderBy: { displayOrder: 'asc' } },
      },
    });
    if (!plo) {
      throw new NotFoundException(`PLO ${id} not found`);
    }
    return plo;
  }

  async update(id: string, dto: UpdatePloDto) {
    await this.findOne(id);
    return this.prisma.plo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.plo.delete({ where: { id } });
  }
}
