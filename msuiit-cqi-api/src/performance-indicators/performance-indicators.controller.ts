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
import { PerformanceIndicatorsService } from './performance-indicators.service';
import { CreatePerformanceIndicatorDto } from './dto/create-performance-indicator.dto';
import { UpdatePerformanceIndicatorDto } from './dto/update-performance-indicator.dto';

@Controller('performance-indicators')
export class PerformanceIndicatorsController {
  constructor(private readonly piService: PerformanceIndicatorsService) {}

  @Post()
  create(@Body() dto: CreatePerformanceIndicatorDto) {
    return this.piService.create(dto);
  }

  @Get()
  findAll(@Query('ploId') ploId?: string) {
    return this.piService.findAll(ploId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.piService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePerformanceIndicatorDto) {
    return this.piService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.piService.remove(id);
  }
}
