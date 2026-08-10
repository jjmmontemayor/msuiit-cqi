import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { MappingLevelsService } from './mapping-levels.service';
import { UpdateMappingLevelDto } from './dto/update-mapping-level.dto';

@Controller('mapping-levels')
export class MappingLevelsController {
  constructor(private readonly mappingLevelsService: MappingLevelsService) {}

  @Get()
  findAll(@Query('programId') programId: string) {
    return this.mappingLevelsService.findAll(programId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMappingLevelDto) {
    return this.mappingLevelsService.update(id, dto);
  }
}
