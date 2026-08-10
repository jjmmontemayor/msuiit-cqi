import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { AttainmentBenchmarkService } from './attainment-benchmark.service';
import { UpdateAttainmentBenchmarkDto } from './dto/update-attainment-benchmark.dto';

@Controller('attainment-benchmark')
export class AttainmentBenchmarkController {
  constructor(private readonly attainmentBenchmarkService: AttainmentBenchmarkService) {}

  @Get()
  get(@Query('programId') programId: string) {
    return this.attainmentBenchmarkService.get(programId);
  }

  @Patch()
  update(@Query('programId') programId: string, @Body() dto: UpdateAttainmentBenchmarkDto) {
    return this.attainmentBenchmarkService.update(programId, dto);
  }
}
