import { IsUUID } from 'class-validator';

export class CreateCohortAdviserDto {
  @IsUUID()
  cohortId!: string;

  @IsUUID()
  facultyId!: string;
}
