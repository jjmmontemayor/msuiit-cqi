import { Module } from '@nestjs/common';
import { PlosService } from './plos.service';
import { PlosController } from './plos.controller';

@Module({
  controllers: [PlosController],
  providers: [PlosService],
  exports: [PlosService],
})
export class PlosModule {}
