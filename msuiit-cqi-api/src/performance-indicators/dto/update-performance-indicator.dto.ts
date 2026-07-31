import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePerformanceIndicatorDto } from './create-performance-indicator.dto';

export class UpdatePerformanceIndicatorDto extends PartialType(
  OmitType(CreatePerformanceIndicatorDto, ['ploId'] as const),
) {}
