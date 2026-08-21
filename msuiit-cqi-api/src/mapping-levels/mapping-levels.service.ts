import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMappingLevelDto } from './dto/create-mapping-level.dto';
import { UpdateMappingLevelDto } from './dto/update-mapping-level.dto';

@Injectable()
export class MappingLevelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMappingLevelDto) {
    try {
      return await this.prisma.mappingLevel.create({
        data: { ...dto, displayCode: dto.displayCode || dto.code },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          `This program already has a mapping level with code "${dto.code}".`,
        );
      }
      throw err;
    }
  }

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
    try {
      return await this.prisma.mappingLevel.update({ where: { id }, data: dto });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          `This program already has a mapping level with code "${dto.code}".`,
        );
      }
      throw err;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.mappingLevel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Mapping level ${id} not found`);
    }
    try {
      return await this.prisma.mappingLevel.delete({ where: { id } });
    } catch (err) {
      if (isForeignKeyRestrictError(err)) {
        throw new ConflictException(
          'This mapping level is still used by existing CLO-PLO or CLO-PI mappings, and cannot be deleted.',
        );
      }
      throw err;
    }
  }
}

// Prisma maps an FK violation on CREATE/UPDATE to its own P2003 error code,
// but a DELETE blocked by ON DELETE RESTRICT surfaces as a
// PrismaClientUnknownRequestError wrapping the raw Postgres connector error
// (SQLSTATE 23001) instead -- there's no dedicated Prisma error code for it,
// so this checks the underlying error text.
function isForeignKeyRestrictError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    return true;
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return /foreign key constraint/i.test(err.message);
  }
  return false;
}
