import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCloDto } from './create-clo.dto';

export class UpdateCloDto extends PartialType(
  OmitType(CreateCloDto, ['courseId'] as const),
) {}
