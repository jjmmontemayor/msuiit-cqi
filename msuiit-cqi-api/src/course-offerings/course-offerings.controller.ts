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
import { CourseOfferingsService } from './course-offerings.service';
import { CreateCourseOfferingDto } from './dto/create-course-offering.dto';
import { UpdateCourseOfferingDto } from './dto/update-course-offering.dto';

@Controller('course-offerings')
export class CourseOfferingsController {
  constructor(
    private readonly courseOfferingsService: CourseOfferingsService,
  ) {}

  @Post()
  create(@Body() dto: CreateCourseOfferingDto) {
    return this.courseOfferingsService.create(dto);
  }

  @Get()
  findAll(
    @Query('courseId') courseId?: string,
    @Query('academicTermId') academicTermId?: string,
  ) {
    return this.courseOfferingsService.findAll({ courseId, academicTermId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseOfferingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseOfferingDto) {
    return this.courseOfferingsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseOfferingsService.remove(id);
  }
}
