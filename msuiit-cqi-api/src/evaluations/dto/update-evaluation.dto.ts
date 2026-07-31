import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateEvaluationDto } from './create-evaluation.dto';

export class UpdateEvaluationDto extends PartialType(
  OmitType(CreateEvaluationDto, ['piId', 'cohortId'] as const),
) {}
