import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCloDto } from './dto/create-clo.dto';
import { UpdateCloDto } from './dto/update-clo.dto';

@Injectable()
export class ClosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCloDto) {
    return this.prisma.clo.create({ data: dto });
  }

  findAll(courseId?: string) {
    return this.prisma.clo.findMany({
      where: courseId ? { courseId } : undefined,
      orderBy: [{ courseId: 'asc' }, { displayOrder: 'asc' }],
    });
  }

  async findOne(id: string) {
    const clo = await this.prisma.clo.findUnique({ where: { id } });
    if (!clo) {
      throw new NotFoundException(`CLO ${id} not found`);
    }
    return clo;
  }

  async update(id: string, dto: UpdateCloDto) {
    await this.findOne(id);
    return this.prisma.clo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.clo.delete({ where: { id } });
  }
}
