import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CohortsService } from './cohorts.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';

@Controller('cohorts')
export class CohortsController {
  constructor(private readonly cohortsService: CohortsService) {}

  @Post()
  create(@Body() dto: CreateCohortDto) {
    return this.cohortsService.create(dto);
  }

  @Get()
  findAll(@Query('programId') programId?: string) {
    return this.cohortsService.findAll(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cohortsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCohortDto) {
    return this.cohortsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cohortsService.remove(id);
  }

  @Post(':id/students/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  importStudents(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.cohortsService.importStudents(id, file);
  }
}
