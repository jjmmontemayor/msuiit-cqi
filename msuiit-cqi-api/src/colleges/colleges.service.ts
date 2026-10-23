import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';

@Injectable()
export class CollegesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCollegeDto) {
    return this.prisma.college.create({ data: dto });
  }

  findAll() {
    return this.prisma.college.findMany({ orderBy: { code: 'asc' } });
  }

  async update(id: string, dto: UpdateCollegeDto) {
    await this.findOne(id);
    return this.prisma.college.update({ where: { id }, data: dto });
  }

  // Programs in the college are left unassigned (FK is ON DELETE SET NULL).
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.college.delete({ where: { id } });
  }

  private async findOne(id: string) {
    const college = await this.prisma.college.findUnique({ where: { id } });
    if (!college) throw new NotFoundException(`College ${id} not found`);
    return college;
  }
}
