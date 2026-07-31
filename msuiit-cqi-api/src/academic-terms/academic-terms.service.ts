import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';

@Injectable()
export class AcademicTermsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAcademicTermDto) {
    return this.prisma.academicTerm.create({ data: dto });
  }

  findAll() {
    return this.prisma.academicTerm.findMany({
      orderBy: [{ schoolYearStart: 'desc' }, { semester: 'asc' }],
    });
  }

  async findOne(id: string) {
    const term = await this.prisma.academicTerm.findUnique({
      where: { id },
    });
    if (!term) {
      throw new NotFoundException(`Academic term ${id} not found`);
    }
    return term;
  }

  async update(id: string, dto: UpdateAcademicTermDto) {
    await this.findOne(id);
    return this.prisma.academicTerm.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.academicTerm.delete({ where: { id } });
  }
}
