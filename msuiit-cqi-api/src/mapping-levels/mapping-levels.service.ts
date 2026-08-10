import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMappingLevelDto } from './dto/update-mapping-level.dto';

@Injectable()
export class MappingLevelsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(programId: string) {
    return this.prisma.mappingLevel.findMany({
      where: { programId },
      orderBy: { weight: 'asc' },
    });
  }

  async update(id: string, dto: UpdateMappingLevelDto) {
    const existing = await this.prisma.mappingLevel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Mapping level ${id} not found`);
    }
    return this.prisma.mappingLevel.update({ where: { id }, data: dto });
  }
}
