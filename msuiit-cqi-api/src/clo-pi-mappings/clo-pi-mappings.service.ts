import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCloPiMappingDto } from './dto/create-clo-pi-mapping.dto';
import { UpdateCloPiMappingDto } from './dto/update-clo-pi-mapping.dto';

@Injectable()
export class CloPiMappingsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCloPiMappingDto) {
    return this.prisma.cloPiMapping.create({ data: dto });
  }

  findAll(params: {
    cloId?: string;
    piId?: string;
    curriculumVersionId?: string;
  }) {
    return this.prisma.cloPiMapping.findMany({
      where: {
        cloId: params.cloId,
        piId: params.piId,
        curriculumVersionId: params.curriculumVersionId,
      },
    });
  }

  async findOne(id: string) {
    const mapping = await this.prisma.cloPiMapping.findUnique({
      where: { id },
    });
    if (!mapping) {
      throw new NotFoundException(`CLO-PI mapping ${id} not found`);
    }
    return mapping;
  }

  async update(id: string, dto: UpdateCloPiMappingDto) {
    await this.findOne(id);
    return this.prisma.cloPiMapping.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cloPiMapping.delete({ where: { id } });
  }
}
