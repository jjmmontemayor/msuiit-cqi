import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCloDto } from './dto/create-clo.dto';
import { UpdateCloDto } from './dto/update-clo.dto';
import { DuplicateCloDto } from './dto/duplicate-clo.dto';

@Injectable()
export class ClosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCloDto) {
    return this.prisma.clo.create({ data: dto });
  }

  findAll(courseId?: string, cohortId?: string) {
    return this.prisma.clo.findMany({
      where: {
        ...(courseId ? { courseId } : {}),
        ...(cohortId ? { cohortId } : {}),
      },
      orderBy: [{ courseId: 'asc' }, { displayOrder: 'asc' }],
    });
  }

  async findOne(id: string) {
    const clo = await this.prisma.clo.findUnique({ where: { id } });
    if (!clo) {
      throw new NotFoundException(`CLO ${id} not found`);
    }
    return clo;
  }

  async update(id: string, dto: UpdateCloDto) {
    const existing = await this.findOne(id);

    const fieldsChanged = Object.keys(dto).filter((key) => key !== 'isLocked');
    const isUnlockOnly =
      existing.isLocked && dto.isLocked === false && fieldsChanged.length === 0;

    if (existing.isLocked && !isUnlockOnly) {
      throw new ForbiddenException(
        'This CLO is locked. Unlock it first, or create a new version for another batch.',
      );
    }

    return this.prisma.clo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    if (existing.isLocked) {
      throw new ForbiddenException(
        'This CLO is locked and cannot be deleted. Unlock it first.',
      );
    }
    return this.prisma.clo.delete({ where: { id } });
  }

  // "Save a version for another batch": copies this CLO's text and its
  // current CLO-PLO mappings into a new CLO row under the target cohort,
  // leaving the source CLO (and its mappings/attainments) untouched. Idempotent
  // per (courseId, code, cohortId) -- calling it again for a target that
  // already has this CLO just returns the existing version.
  async duplicateToCohort(id: string, dto: DuplicateCloDto) {
    const source = await this.findOne(id);

    const existingInTarget = await this.prisma.clo.findUnique({
      where: {
        courseId_code_cohortId: {
          courseId: source.courseId,
          code: source.code,
          cohortId: dto.cohortId,
        },
      },
    });
    if (existingInTarget) {
      return existingInTarget;
    }

    const sourceMappings = await this.prisma.cloPloMapping.findMany({
      where: { cloId: id },
    });

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.clo.create({
        data: {
          courseId: source.courseId,
          cohortId: dto.cohortId,
          code: source.code,
          description: source.description,
          displayOrder: source.displayOrder,
          isLocked: false,
        },
      });

      if (sourceMappings.length > 0) {
        await tx.cloPloMapping.createMany({
          data: sourceMappings.map((m) => ({
            cloId: created.id,
            ploId: m.ploId,
            cohortId: dto.cohortId,
            levelCode: m.levelCode,
            piId: m.piId,
            assessmentMethod: m.assessmentMethod,
          })),
        });
      }

      return created;
    });
  }
}
