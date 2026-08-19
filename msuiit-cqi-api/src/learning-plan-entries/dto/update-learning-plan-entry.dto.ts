import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateLearningPlanEntryDto } from './create-learning-plan-entry.dto';

export class UpdateLearningPlanEntryDto extends PartialType(
  OmitType(CreateLearningPlanEntryDto, ['courseOfferingId'] as const),
) {}
