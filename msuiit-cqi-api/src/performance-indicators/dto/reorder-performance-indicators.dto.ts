import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderPerformanceIndicatorsDto {
  @IsUUID()
  ploId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids!: string[];
}
