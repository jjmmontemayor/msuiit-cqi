import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerformanceIndicatorDto } from './dto/create-performance-indicator.dto';
import { ReorderPerformanceIndicatorsDto } from './dto/reorder-performance-indicators.dto';
import { UpdatePerformanceIndicatorDto } from './dto/update-performance-indicator.dto';

// PI1, PI2, ... -- always derived from the position within the PLO.
const piCode = (n: number) => `PI${n}`;

@Injectable()
export class PerformanceIndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  // New indicators go to the end of their PLO; the code is generated.
  async create(dto: CreatePerformanceIndicatorDto) {
    const last = await this.prisma.performanceIndicator.aggregate({
      where: { ploId: dto.ploId },
      _max: { displayOrder: true },
    });
    const pi = await this.prisma.performanceIndicator.create({
      data: {
        ploId: dto.ploId,
        description: dto.description,
        assessment: dto.assessment,
        // Placeholder; renumber() below assigns the real code.
        code: `__new_${randomUUID()}`,
        displayOrder: (last._max.displayOrder ?? 0) + 1,
      },
    });
    await this.renumber(dto.ploId);
    return this.findOne(pi.id);
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

  // Description and assessment only; code and order follow the list position.
  async update(id: string, dto: UpdatePerformanceIndicatorDto) {
    await this.findOne(id);
    return this.prisma.performanceIndicator.update({
      where: { id },
      data: { description: dto.description, assessment: dto.assessment },
    });
  }

  async remove(id: string) {
    const pi = await this.findOne(id);
    const removed = await this.prisma.performanceIndicator.delete({
      where: { id },
    });
    await this.renumber(pi.ploId);
    return removed;
  }

  // Applies a new order (all PI ids of the PLO, in order) and renumbers.
  async reorder(dto: ReorderPerformanceIndicatorsDto) {
    const current = await this.prisma.performanceIndicator.findMany({
      where: { ploId: dto.ploId },
      select: { id: true },
    });
    const sameSet =
      dto.ids.length === current.length &&
      new Set(dto.ids).size === dto.ids.length &&
      current.every((p) => dto.ids.includes(p.id));
    if (!sameSet) {
      throw new BadRequestException(
        'ids must list every performance indicator of the PLO exactly once.',
      );
    }
    await this.renumber(dto.ploId, dto.ids);
    return this.findAll(dto.ploId);
  }

  // Assigns PI1.. and display order 1.. by position; codes are parked on
  // temporary values first so the unique (PLO, code) constraint never clashes.
  private async renumber(ploId: string, orderedIds?: string[]) {
    const ids =
      orderedIds ??
      (
        await this.prisma.performanceIndicator.findMany({
          where: { ploId },
          orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
          select: { id: true },
        })
      ).map((p) => p.id);

    await this.prisma.$transaction([
      ...ids.map((id) =>
        this.prisma.performanceIndicator.update({
          where: { id },
          data: { code: `__tmp_${id}` },
        }),
      ),
      ...ids.map((id, i) =>
        this.prisma.performanceIndicator.update({
          where: { id },
          data: { code: piCode(i + 1), displayOrder: i + 1 },
        }),
      ),
    ]);
  }
}
