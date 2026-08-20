import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCloPiMappingDto } from './create-clo-pi-mapping.dto';

export class UpdateCloPiMappingDto extends PartialType(
  OmitType(CreateCloPiMappingDto, [
    'cloId',
    'piId',
    'curriculumVersionId',
  ] as const),
) {}
