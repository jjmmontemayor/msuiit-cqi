import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertOfferingCloDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxonomy?: string | null;

  @IsOptional()
  @IsString()
  evidenceReference?: string | null;
}

export class CreateAssessmentTaskDto {
  @IsUUID()
  cloId!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxScore?: number;
}

export class UpdateAssessmentTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxScore?: number;
}
