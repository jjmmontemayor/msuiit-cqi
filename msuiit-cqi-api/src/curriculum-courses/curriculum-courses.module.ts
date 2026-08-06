import { Module } from '@nestjs/common';
import { CurriculumCoursesService } from './curriculum-courses.service';
import { CurriculumCoursesController } from './curriculum-courses.controller';

@Module({
  controllers: [CurriculumCoursesController],
  providers: [CurriculumCoursesService],
  exports: [CurriculumCoursesService],
})
export class CurriculumCoursesModule {}
