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
import { CurriculumVersionsService } from './curriculum-versions.service';
import { CreateCurriculumVersionDto } from './dto/create-curriculum-version.dto';
import { UpdateCurriculumVersionDto } from './dto/update-curriculum-version.dto';

@Controller('curriculum-versions')
export class CurriculumVersionsController {
  constructor(
    private readonly curriculumVersionsService: CurriculumVersionsService,
  ) {}

  @Post()
  create(@Body() dto: CreateCurriculumVersionDto) {
    return this.curriculumVersionsService.create(dto);
  }

  @Get()
  findAll(@Query('programId') programId?: string) {
    return this.curriculumVersionsService.findAll(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.curriculumVersionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCurriculumVersionDto) {
    return this.curriculumVersionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.curriculumVersionsService.remove(id);
  }
}
