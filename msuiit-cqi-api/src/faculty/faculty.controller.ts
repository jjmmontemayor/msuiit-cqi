import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Post()
  create(@Body() dto: CreateFacultyDto) {
    return this.facultyService.create(dto);
  }

  @Get()
  findAll(@Query('programId') programId?: string) {
    return this.facultyService.findAll(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facultyService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFacultyDto) {
    return this.facultyService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.facultyService.remove(id);
  }
}
