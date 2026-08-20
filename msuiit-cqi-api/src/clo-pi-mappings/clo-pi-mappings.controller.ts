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
import { CloPiMappingsService } from './clo-pi-mappings.service';
import { CreateCloPiMappingDto } from './dto/create-clo-pi-mapping.dto';
import { UpdateCloPiMappingDto } from './dto/update-clo-pi-mapping.dto';

@Controller('clo-pi-mappings')
export class CloPiMappingsController {
  constructor(private readonly cloPiMappingsService: CloPiMappingsService) {}

  @Post()
  create(@Body() dto: CreateCloPiMappingDto) {
    return this.cloPiMappingsService.create(dto);
  }

  @Get()
  findAll(
    @Query('cloId') cloId?: string,
    @Query('piId') piId?: string,
    @Query('curriculumVersionId') curriculumVersionId?: string,
  ) {
    return this.cloPiMappingsService.findAll({ cloId, piId, curriculumVersionId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cloPiMappingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCloPiMappingDto) {
    return this.cloPiMappingsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cloPiMappingsService.remove(id);
  }
}
