import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCloPiMappingDto {
  @IsUUID()
  cloId!: string;

  @IsUUID()
  piId!: string;

  @IsUUID()
  curriculumVersionId!: string;

  @IsUUID()
  mappingLevelId!: string;

  @IsOptional()
  @IsString()
  assessmentMethod?: string;
}
