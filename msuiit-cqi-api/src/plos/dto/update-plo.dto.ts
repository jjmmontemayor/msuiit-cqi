import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePloDto } from './create-plo.dto';

export class UpdatePloDto extends PartialType(
  OmitType(CreatePloDto, ['programId'] as const),
) {}
