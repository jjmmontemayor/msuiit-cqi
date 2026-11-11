import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePerformanceIndicatorDto {
  @IsUUID()
  ploId!: string;

  // Ignored: the code is generated from the position within the PLO.
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  // Ignored: new PIs are appended; reorder with POST /performance-indicators/reorder.
  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
