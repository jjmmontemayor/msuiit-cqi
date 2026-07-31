import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCourseOfferingDto } from './create-course-offering.dto';

export class UpdateCourseOfferingDto extends PartialType(
  OmitType(CreateCourseOfferingDto, ['courseId', 'academicTermId'] as const),
) {}
