import { IsBoolean, IsOptional } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCloDto } from './create-clo.dto';

// courseId and cohortId are immutable after creation -- moving a CLO to a
// different batch happens via POST /clos/:id/duplicate, which creates a new
// row under the target cohort instead of relocating this one.
export class UpdateCloDto extends PartialType(
  OmitType(CreateCloDto, ['courseId', 'cohortId'] as const),
) {
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
