import { Module } from '@nestjs/common';
import { CohortAdvisersService } from './cohort-advisers.service';
import { CohortAdvisersController } from './cohort-advisers.controller';

@Module({
  controllers: [CohortAdvisersController],
  providers: [CohortAdvisersService],
})
export class CohortAdvisersModule {}
