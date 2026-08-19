import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCurriculumVersionDto } from './create-curriculum-version.dto';

export class UpdateCurriculumVersionDto extends PartialType(
  OmitType(CreateCurriculumVersionDto, ['programId'] as const),
) {}
