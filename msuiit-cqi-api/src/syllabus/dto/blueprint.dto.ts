import {
  IsBoolean,
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
  @IsString()
  description?: string | null;

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
  @IsOptional()
  @IsUUID()
  cloId?: string | null;

  @IsOptional()
  @IsUUID()
  learningPlanEntryId?: string | null;

  @IsOptional()
  @IsBoolean()
  included?: boolean;

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
  @IsUUID()
  cloId?: string | null;

  @IsOptional()
  @IsBoolean()
  included?: boolean;

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

export class SetAlignmentDto {
  @IsUUID()
  cloId!: string;

  @IsUUID()
  ploId!: string;

  // A level display code, '' for a deliberate blank, null to use the program mapping.
  @IsOptional()
  @IsString()
  @MaxLength(20)
  levelCode?: string | null;
}
