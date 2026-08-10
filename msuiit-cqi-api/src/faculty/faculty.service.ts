import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Injectable()
export class FacultyService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFacultyDto) {
    return this.prisma.faculty.create({ data: dto });
  }

  findAll(programId?: string) {
    return this.prisma.faculty.findMany({
      where: programId ? { programId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const faculty = await this.prisma.faculty.findUnique({ where: { id } });
    if (!faculty) {
      throw new NotFoundException(`Faculty ${id} not found`);
    }
    return faculty;
  }

  async update(id: string, dto: UpdateFacultyDto) {
    await this.findOne(id);
    return this.prisma.faculty.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.faculty.delete({ where: { id } });
  }
}
