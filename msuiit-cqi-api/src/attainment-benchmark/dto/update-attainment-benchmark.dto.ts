import { IsInt, Max, Min } from 'class-validator';

export class UpdateAttainmentBenchmarkDto {
  @IsInt()
  @Min(1)
  @Max(100)
  percentage!: number;
}
