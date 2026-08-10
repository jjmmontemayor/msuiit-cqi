import { Module } from '@nestjs/common';
import { MappingLevelsService } from './mapping-levels.service';
import { MappingLevelsController } from './mapping-levels.controller';

@Module({
  controllers: [MappingLevelsController],
  providers: [MappingLevelsService],
})
export class MappingLevelsModule {}
