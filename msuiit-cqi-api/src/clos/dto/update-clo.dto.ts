import { IsBoolean, IsOptional } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCloDto } from './create-clo.dto';

// courseId and curriculumVersionId are immutable after creation -- moving a
// CLO to a different curriculum version happens via POST /clos/:id/duplicate,
// which creates a new row under the target version instead of relocating
// this one.
export class UpdateCloDto extends PartialType(
  OmitType(CreateCloDto, ['courseId', 'curriculumVersionId'] as const),
) {
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
