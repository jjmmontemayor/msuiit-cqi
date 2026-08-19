import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMappingDto } from './dto/create-mapping.dto';
import { UpdateMappingDto } from './dto/update-mapping.dto';

@Injectable()
export class MappingsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMappingDto) {
    return this.prisma.cloPloMapping.create({ data: dto });
  }

  findAll(params: {
    cloId?: string;
    ploId?: string;
    courseId?: string;
    curriculumVersionId?: string;
  }) {
    return this.prisma.cloPloMapping.findMany({
      where: {
        cloId: params.cloId,
        ploId: params.ploId,
        curriculumVersionId: params.curriculumVersionId,
        clo: params.courseId ? { courseId: params.courseId } : undefined,
      },
      include: { pi: true },
    });
  }

  async findOne(id: string) {
    const mapping = await this.prisma.cloPloMapping.findUnique({
      where: { id },
      include: { pi: true },
    });
    if (!mapping) {
      throw new NotFoundException(`Mapping ${id} not found`);
    }
    return mapping;
  }

  async update(id: string, dto: UpdateMappingDto) {
    await this.findOne(id);
    return this.prisma.cloPloMapping.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cloPloMapping.delete({ where: { id } });
  }
}
