import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MappingLevelsService } from './mapping-levels.service';
import { CreateMappingLevelDto } from './dto/create-mapping-level.dto';
import { UpdateMappingLevelDto } from './dto/update-mapping-level.dto';

@Controller('mapping-levels')
export class MappingLevelsController {
  constructor(private readonly mappingLevelsService: MappingLevelsService) {}

  @Post()
  create(@Body() dto: CreateMappingLevelDto) {
    return this.mappingLevelsService.create(dto);
  }

  @Get()
  findAll(@Query('programId') programId: string) {
    return this.mappingLevelsService.findAll(programId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMappingLevelDto) {
    return this.mappingLevelsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mappingLevelsService.remove(id);
  }
}
