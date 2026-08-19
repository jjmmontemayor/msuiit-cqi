import { Module } from '@nestjs/common';
import { LearningPlanEntriesService } from './learning-plan-entries.service';
import { LearningPlanEntriesController } from './learning-plan-entries.controller';

@Module({
  controllers: [LearningPlanEntriesController],
  providers: [LearningPlanEntriesService],
  exports: [LearningPlanEntriesService],
})
export class LearningPlanEntriesModule {}
