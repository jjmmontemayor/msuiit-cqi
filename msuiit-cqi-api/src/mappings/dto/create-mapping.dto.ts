import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MappingLevelCode } from '@prisma/client';

export class CreateMappingDto {
  @IsUUID()
  cloId!: string;

  @IsUUID()
  ploId!: string;

  @IsUUID()
  cohortId!: string;

  @IsEnum(MappingLevelCode)
  levelCode!: MappingLevelCode;

  @IsOptional()
  @IsUUID()
  piId?: string;

  @IsOptional()
  @IsString()
  assessmentMethod?: string;
}
