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
import { PlosService } from './plos.service';
import { CreatePloDto } from './dto/create-plo.dto';
import { ReorderPlosDto } from './dto/reorder-plos.dto';
import { UpdatePloDto } from './dto/update-plo.dto';

@Controller('plos')
export class PlosController {
  constructor(private readonly plosService: PlosService) {}

  @Post()
  create(@Body() dto: CreatePloDto) {
    return this.plosService.create(dto);
  }

  @Post('reorder')
  reorder(@Body() dto: ReorderPlosDto) {
    return this.plosService.reorder(dto);
  }

  @Get()
  findAll(@Query('programId') programId?: string) {
    return this.plosService.findAll(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePloDto) {
    return this.plosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plosService.remove(id);
  }
}
