import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCurriculumCourseDto } from './create-curriculum-course.dto';

export class UpdateCurriculumCourseDto extends PartialType(
  OmitType(CreateCurriculumCourseDto, ['programId', 'courseId'] as const),
) {}
