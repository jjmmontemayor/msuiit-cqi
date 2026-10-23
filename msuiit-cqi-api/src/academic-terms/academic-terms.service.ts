import { Injectable, NotFoundException } from '@nestjs/common';
import { Semester } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';

const SEMESTER_LABELS: Record<Semester, string> = {
  FIRST: '1st Sem',
  SECOND: '2nd Sem',
  SUMMER: 'Summer',
};

function buildLabel(start: number, end: number, semester: Semester): string {
  return `AY${start}-${end} ${SEMESTER_LABELS[semester]}`;
}

@Injectable()
export class AcademicTermsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAcademicTermDto) {
    const label =
      dto.label?.trim() || buildLabel(dto.schoolYearStart, dto.schoolYearEnd, dto.semester);
    return this.prisma.academicTerm.create({ data: { ...dto, label } });
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
    const existing = await this.findOne(id);
    const data = { ...dto };
    if (!data.label?.trim() && (dto.schoolYearStart || dto.schoolYearEnd || dto.semester)) {
      data.label = buildLabel(
        dto.schoolYearStart ?? existing.schoolYearStart,
        dto.schoolYearEnd ?? existing.schoolYearEnd,
        dto.semester ?? existing.semester,
      );
    }
    return this.prisma.academicTerm.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.academicTerm.delete({ where: { id } });
  }
}
