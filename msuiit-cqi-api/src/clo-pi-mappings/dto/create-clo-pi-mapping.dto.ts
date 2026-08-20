import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MappingLevelCode } from '@prisma/client';

export class CreateCloPiMappingDto {
  @IsUUID()
  cloId!: string;

  @IsUUID()
  piId!: string;

  @IsUUID()
  curriculumVersionId!: string;

  @IsEnum(MappingLevelCode)
  levelCode!: MappingLevelCode;

  @IsOptional()
  @IsString()
  assessmentMethod?: string;
}
