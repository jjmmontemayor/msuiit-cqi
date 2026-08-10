import { Module } from '@nestjs/common';
import { AttainmentBenchmarkService } from './attainment-benchmark.service';
import { AttainmentBenchmarkController } from './attainment-benchmark.controller';

@Module({
  controllers: [AttainmentBenchmarkController],
  providers: [AttainmentBenchmarkService],
})
export class AttainmentBenchmarkModule {}
