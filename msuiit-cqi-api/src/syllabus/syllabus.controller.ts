import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { SyllabusService, type ExportFile } from './syllabus.service';
import {
  CreateAssessmentTaskDto,
  UpdateAssessmentTaskDto,
  UpsertOfferingCloDto,
} from './dto/blueprint.dto';

function send(res: Response, file: ExportFile) {
  res.setHeader('Content-Type', file.contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${file.filename}"`,
  );
  res.send(file.body);
}

@Controller()
export class SyllabusController {
  constructor(private readonly syllabusService: SyllabusService) {}

  @Get('course-offerings/:id/blueprint')
  blueprint(@Param('id') id: string) {
    return this.syllabusService.getBlueprint(id);
  }

  @Put('course-offerings/:id/clos/:cloId')
  upsertClo(
    @Param('id') id: string,
    @Param('cloId') cloId: string,
    @Body() dto: UpsertOfferingCloDto,
  ) {
    return this.syllabusService.upsertOfferingClo(id, cloId, dto);
  }

  @Post('course-offerings/:id/assessment-tasks')
  createTask(@Param('id') id: string, @Body() dto: CreateAssessmentTaskDto) {
    return this.syllabusService.createTask(id, dto);
  }

  @Patch('assessment-tasks/:taskId')
  updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateAssessmentTaskDto,
  ) {
    return this.syllabusService.updateTask(taskId, dto);
  }

  @Delete('assessment-tasks/:taskId')
  removeTask(@Param('taskId') taskId: string) {
    return this.syllabusService.removeTask(taskId);
  }

  @Get('course-offerings/:id/export/syllabus')
  async exportSyllabus(
    @Param('id') id: string,
    @Query('format') format: string = 'pdf',
    @Res() res: Response,
  ) {
    if (format !== 'pdf' && format !== 'typ') {
      throw new BadRequestException('format must be pdf or typ');
    }
    send(res, await this.syllabusService.exportSyllabus(id, format));
  }

  @Get('course-offerings/:id/export/grading-sheet')
  async exportGradingSheet(
    @Param('id') id: string,
    @Query('format') format: string = 'xlsx',
    @Res() res: Response,
  ) {
    if (format !== 'xlsx' && format !== 'csv') {
      throw new BadRequestException('format must be xlsx or csv');
    }
    send(res, await this.syllabusService.exportGradingSheet(id, format));
  }
}
