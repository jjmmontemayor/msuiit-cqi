import { IsUUID } from 'class-validator';

export class CreateMappingDto {
  @IsUUID()
  cloId!: string;

  @IsUUID()
  ploId!: string;

  @IsUUID()
  curriculumVersionId!: string;

  @IsUUID()
  mappingLevelId!: string;
}
