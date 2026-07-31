import { Module } from '@nestjs/common';
import { ClosService } from './clos.service';
import { ClosController } from './clos.controller';

@Module({
  controllers: [ClosController],
  providers: [ClosService],
  exports: [ClosService],
})
export class ClosModule {}
