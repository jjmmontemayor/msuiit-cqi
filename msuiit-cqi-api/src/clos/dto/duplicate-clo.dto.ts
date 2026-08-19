import { IsUUID } from 'class-validator';

export class DuplicateCloDto {
  @IsUUID()
  curriculumVersionId!: string;
}
