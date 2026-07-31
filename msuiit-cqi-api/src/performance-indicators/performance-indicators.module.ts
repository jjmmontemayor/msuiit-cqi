import { Module } from '@nestjs/common';
import { PerformanceIndicatorsService } from './performance-indicators.service';
import { PerformanceIndicatorsController } from './performance-indicators.controller';

@Module({
  controllers: [PerformanceIndicatorsController],
  providers: [PerformanceIndicatorsService],
  exports: [PerformanceIndicatorsService],
})
export class PerformanceIndicatorsModule {}
