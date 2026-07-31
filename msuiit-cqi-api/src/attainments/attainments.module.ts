import { Module } from '@nestjs/common';
import { AttainmentsService } from './attainments.service';
import { AttainmentsController } from './attainments.controller';

@Module({
  controllers: [AttainmentsController],
  providers: [AttainmentsService],
  exports: [AttainmentsService],
})
export class AttainmentsModule {}
