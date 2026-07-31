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

  @IsString()
  @MaxLength(20)
  code!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
