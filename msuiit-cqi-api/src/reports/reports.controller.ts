import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('clo-attainment-by-course')
  cloAttainmentByCourse(@Query('courseId') courseId?: string) {
    return this.reportsService.cloAttainmentByCourse(courseId);
  }

  @Get('plo-attainment-by-course')
  ploAttainmentByCourse(@Query('courseId') courseId?: string) {
    return this.reportsService.ploAttainmentByCourse(courseId);
  }

  @Get('plo-attainment-by-student')
  ploAttainmentByStudent(@Query('studentId') studentId?: string) {
    return this.reportsService.ploAttainmentByStudent(studentId);
  }

  @Get('program-plo-performance')
  programPloPerformance(@Query('programId') programId?: string) {
    return this.reportsService.programPloPerformance(programId);
  }
}
