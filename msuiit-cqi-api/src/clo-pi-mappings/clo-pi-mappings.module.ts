import { Module } from '@nestjs/common';
import { CloPiMappingsService } from './clo-pi-mappings.service';
import { CloPiMappingsController } from './clo-pi-mappings.controller';

@Module({
  controllers: [CloPiMappingsController],
  providers: [CloPiMappingsService],
})
export class CloPiMappingsModule {}
