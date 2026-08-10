import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CohortAdvisersService } from './cohort-advisers.service';
import { CreateCohortAdviserDto } from './dto/create-cohort-adviser.dto';

@Controller('cohort-advisers')
export class CohortAdvisersController {
  constructor(private readonly cohortAdvisersService: CohortAdvisersService) {}

  @Post()
  create(@Body() dto: CreateCohortAdviserDto) {
    return this.cohortAdvisersService.create(dto);
  }

  @Get()
  findAll(@Query('cohortId') cohortId?: string) {
    return this.cohortAdvisersService.findAll(cohortId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cohortAdvisersService.remove(id);
  }
}
