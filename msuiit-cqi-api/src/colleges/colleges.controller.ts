import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';

@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  @Post()
  create(@Body() dto: CreateCollegeDto) {
    return this.collegesService.create(dto);
  }

  @Get()
  findAll() {
    return this.collegesService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCollegeDto) {
    return this.collegesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collegesService.remove(id);
  }
}
