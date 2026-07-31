import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';

@Injectable()
export class EvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEvaluationDto) {
    return this.prisma.piEvaluation.create({ data: dto });
  }

  findAll(params: { piId?: string; cohortId?: string }) {
    return this.prisma.piEvaluation.findMany({
      where: { piId: params.piId, cohortId: params.cohortId },
      include: { pi: true, cohort: true },
    });
  }

  async findOne(id: string) {
    const evaluation = await this.prisma.piEvaluation.findUnique({
      where: { id },
      include: { pi: true, cohort: true },
    });
    if (!evaluation) {
      throw new NotFoundException(`Evaluation ${id} not found`);
    }
    return evaluation;
  }

  async update(id: string, dto: UpdateEvaluationDto) {
    await this.findOne(id);
    return this.prisma.piEvaluation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.piEvaluation.delete({ where: { id } });
  }
}
