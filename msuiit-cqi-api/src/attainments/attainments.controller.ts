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
import { AttainmentsService } from './attainments.service';
import { CreateAttainmentDto } from './dto/create-attainment.dto';
import { UpdateAttainmentDto } from './dto/update-attainment.dto';

@Controller('attainments')
export class AttainmentsController {
  constructor(private readonly attainmentsService: AttainmentsService) {}

  @Post()
  create(@Body() dto: CreateAttainmentDto) {
    return this.attainmentsService.create(dto);
  }

  @Get()
  findAll(
    @Query('enrollmentId') enrollmentId?: string,
    @Query('cloId') cloId?: string,
  ) {
    return this.attainmentsService.findAll({ enrollmentId, cloId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attainmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttainmentDto) {
    return this.attainmentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attainmentsService.remove(id);
  }
}
