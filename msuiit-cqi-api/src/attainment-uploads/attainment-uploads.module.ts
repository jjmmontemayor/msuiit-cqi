import { Module } from '@nestjs/common';
import { AttainmentUploadsService } from './attainment-uploads.service';
import { AttainmentUploadsController } from './attainment-uploads.controller';

@Module({
  controllers: [AttainmentUploadsController],
  providers: [AttainmentUploadsService],
})
export class AttainmentUploadsModule {}
