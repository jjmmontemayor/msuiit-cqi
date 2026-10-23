import { IsInt, IsOptional, IsString, IsUUID, Max, Min, MaxLength } from 'class-validator';

export class CreateCurriculumVersionDto {
  @IsUUID()
  programId!: string;

  @IsString()
  @MaxLength(20)
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  effectiveYear?: number | null;
}
