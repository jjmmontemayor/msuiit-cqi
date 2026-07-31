import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttainmentDto } from './dto/create-attainment.dto';
import { UpdateAttainmentDto } from './dto/update-attainment.dto';

@Injectable()
export class AttainmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAttainmentDto) {
    return this.prisma.cloAttainment.create({ data: dto });
  }

  findAll(params: { enrollmentId?: string; cloId?: string }) {
    return this.prisma.cloAttainment.findMany({
      where: {
        enrollmentId: params.enrollmentId,
        cloId: params.cloId,
      },
    });
  }

  async findOne(id: string) {
    const attainment = await this.prisma.cloAttainment.findUnique({
      where: { id },
    });
    if (!attainment) {
      throw new NotFoundException(`CLO attainment ${id} not found`);
    }
    return attainment;
  }

  async update(id: string, dto: UpdateAttainmentDto) {
    await this.findOne(id);
    return this.prisma.cloAttainment.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cloAttainment.delete({ where: { id } });
  }
}
