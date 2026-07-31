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
import { ClosService } from './clos.service';
import { CreateCloDto } from './dto/create-clo.dto';
import { UpdateCloDto } from './dto/update-clo.dto';

@Controller('clos')
export class ClosController {
  constructor(private readonly closService: ClosService) {}

  @Post()
  create(@Body() dto: CreateCloDto) {
    return this.closService.create(dto);
  }

  @Get()
  findAll(@Query('courseId') courseId?: string) {
    return this.closService.findAll(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.closService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCloDto) {
    return this.closService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.closService.remove(id);
  }
}
