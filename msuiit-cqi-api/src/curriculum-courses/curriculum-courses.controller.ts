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
import { CurriculumCoursesService } from './curriculum-courses.service';
import { CreateCurriculumCourseDto } from './dto/create-curriculum-course.dto';
import { UpdateCurriculumCourseDto } from './dto/update-curriculum-course.dto';

@Controller('curriculum-courses')
export class CurriculumCoursesController {
  constructor(
    private readonly curriculumCoursesService: CurriculumCoursesService,
  ) {}

  @Post()
  create(@Body() dto: CreateCurriculumCourseDto) {
    return this.curriculumCoursesService.create(dto);
  }

  @Get()
  findAll(@Query('programId') programId?: string) {
    return this.curriculumCoursesService.findAll(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.curriculumCoursesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCurriculumCourseDto) {
    return this.curriculumCoursesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.curriculumCoursesService.remove(id);
  }
}
