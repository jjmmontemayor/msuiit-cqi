import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class UpdateMappingLevelDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;
}
