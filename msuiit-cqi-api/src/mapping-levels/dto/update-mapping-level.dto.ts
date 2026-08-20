import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class UpdateMappingLevelDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  displayCode?: string;
}
