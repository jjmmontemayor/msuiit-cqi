import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCohortDto } from './create-cohort.dto';

export class UpdateCohortDto extends PartialType(
  OmitType(CreateCohortDto, ['programId'] as const),
) {}
