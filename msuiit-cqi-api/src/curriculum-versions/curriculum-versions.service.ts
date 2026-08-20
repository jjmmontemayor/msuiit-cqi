import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurriculumVersionDto } from './dto/create-curriculum-version.dto';
import { UpdateCurriculumVersionDto } from './dto/update-curriculum-version.dto';

@Injectable()
export class CurriculumVersionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCurriculumVersionDto) {
    return this.prisma.curriculumVersion.create({ data: dto });
  }

  findAll(programId?: string) {
    return this.prisma.curriculumVersion.findMany({
      where: programId ? { programId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const version = await this.prisma.curriculumVersion.findUnique({
      where: { id },
    });
    if (!version) {
      throw new NotFoundException(`Curriculum version ${id} not found`);
    }
    return version;
  }

  async update(id: string, dto: UpdateCurriculumVersionDto) {
    await this.findOne(id);
    return this.prisma.curriculumVersion.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.curriculumVersion.delete({ where: { id } });
  }
}
