import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePloDto } from './dto/create-plo.dto';
import { ReorderPlosDto } from './dto/reorder-plos.dto';
import { UpdatePloDto } from './dto/update-plo.dto';

// PLO01, PLO02, ... -- always derived from the position in the list.
const ploCode = (n: number) => `PLO${String(n).padStart(2, '0')}`;

@Injectable()
export class PlosService {
  constructor(private readonly prisma: PrismaService) {}

  // New outcomes go to the end of the list; the code is generated, never typed.
  async create(dto: CreatePloDto) {
    const last = await this.prisma.plo.aggregate({
      where: { programId: dto.programId },
      _max: { displayOrder: true },
    });
    const plo = await this.prisma.plo.create({
      data: {
        programId: dto.programId,
        description: dto.description,
        // Placeholder; renumber() below assigns the real code.
        code: `__new_${randomUUID()}`,
        displayOrder: (last._max.displayOrder ?? 0) + 1,
      },
    });
    await this.renumber(dto.programId);
    return this.findOne(plo.id);
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

  // Only the description is editable; code and order follow the list position.
  async update(id: string, dto: UpdatePloDto) {
    await this.findOne(id);
    return this.prisma.plo.update({
      where: { id },
      data: { description: dto.description },
    });
  }

  async remove(id: string) {
    const plo = await this.findOne(id);
    const removed = await this.prisma.plo.delete({ where: { id } });
    await this.renumber(plo.programId);
    return removed;
  }

  // Applies a new order (all PLO ids of the program, in order) and renumbers.
  async reorder(dto: ReorderPlosDto) {
    const current = await this.prisma.plo.findMany({
      where: { programId: dto.programId },
      select: { id: true },
    });
    const sameSet =
      dto.ids.length === current.length &&
      new Set(dto.ids).size === dto.ids.length &&
      current.every((p) => dto.ids.includes(p.id));
    if (!sameSet) {
      throw new BadRequestException(
        "ids must list every PLO of the program exactly once.",
      );
    }
    await this.renumber(dto.programId, dto.ids);
    return this.findAll(dto.programId);
  }

  // Assigns PLO01.. and display order 1.. by position. The unique
  // (program, code) constraint is dodged by parking every code on a temporary
  // value first, all inside one transaction.
  private async renumber(programId: string, orderedIds?: string[]) {
    const ids =
      orderedIds ??
      (
        await this.prisma.plo.findMany({
          where: { programId },
          orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
          select: { id: true },
        })
      ).map((p) => p.id);

    await this.prisma.$transaction([
      ...ids.map((id) =>
        this.prisma.plo.update({
          where: { id },
          data: { code: `__tmp_${id}` },
        }),
      ),
      ...ids.map((id, i) =>
        this.prisma.plo.update({
          where: { id },
          data: { code: ploCode(i + 1), displayOrder: i + 1 },
        }),
      ),
    ]);
  }
}
