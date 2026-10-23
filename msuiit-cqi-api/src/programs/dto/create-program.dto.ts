import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @MaxLength(20)
  code!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  collegeId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  yearEstablished?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  revisionCycleYears?: number;
}
