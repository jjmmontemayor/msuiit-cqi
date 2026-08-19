import { Module } from '@nestjs/common';
import { CurriculumVersionsService } from './curriculum-versions.service';
import { CurriculumVersionsController } from './curriculum-versions.controller';

@Module({
  controllers: [CurriculumVersionsController],
  providers: [CurriculumVersionsService],
  exports: [CurriculumVersionsService],
})
export class CurriculumVersionsModule {}
