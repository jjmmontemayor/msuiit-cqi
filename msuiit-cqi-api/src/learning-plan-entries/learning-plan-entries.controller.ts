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
import { LearningPlanEntriesService } from './learning-plan-entries.service';
import { CreateLearningPlanEntryDto } from './dto/create-learning-plan-entry.dto';
import { UpdateLearningPlanEntryDto } from './dto/update-learning-plan-entry.dto';

@Controller('learning-plan-entries')
export class LearningPlanEntriesController {
  constructor(
    private readonly learningPlanEntriesService: LearningPlanEntriesService,
  ) {}

  @Post()
  create(@Body() dto: CreateLearningPlanEntryDto) {
    return this.learningPlanEntriesService.create(dto);
  }

  @Get()
  findAll(@Query('courseOfferingId') courseOfferingId?: string) {
    return this.learningPlanEntriesService.findAll(courseOfferingId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.learningPlanEntriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLearningPlanEntryDto) {
    return this.learningPlanEntriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.learningPlanEntriesService.remove(id);
  }
}
