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
import { MappingsService } from './mappings.service';
import { CreateMappingDto } from './dto/create-mapping.dto';
import { UpdateMappingDto } from './dto/update-mapping.dto';

@Controller('mappings')
export class MappingsController {
  constructor(private readonly mappingsService: MappingsService) {}

  @Post()
  create(@Body() dto: CreateMappingDto) {
    return this.mappingsService.create(dto);
  }

  @Get()
  findAll(
    @Query('cloId') cloId?: string,
    @Query('ploId') ploId?: string,
    @Query('courseId') courseId?: string,
    @Query('cohortId') cohortId?: string,
  ) {
    return this.mappingsService.findAll({ cloId, ploId, courseId, cohortId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mappingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMappingDto) {
    return this.mappingsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mappingsService.remove(id);
  }
}
