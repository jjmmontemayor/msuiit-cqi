import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateMappingDto } from './create-mapping.dto';

export class UpdateMappingDto extends PartialType(
  OmitType(CreateMappingDto, [
    'cloId',
    'ploId',
    'curriculumVersionId',
  ] as const),
) {}
