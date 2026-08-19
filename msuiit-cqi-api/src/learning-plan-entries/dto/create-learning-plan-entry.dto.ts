import { IsInt, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLearningPlanEntryDto {
  @IsUUID()
  courseOfferingId!: string;

  @IsString()
  @MaxLength(50)
  weekLabel!: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsString()
  topics!: string;

  @IsOptional()
  @IsString()
  lessonOutcome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  coLabels?: string;

  @IsOptional()
  @IsString()
  methodology?: string;

  @IsOptional()
  @IsString()
  learningResources?: string;

  @IsOptional()
  @IsString()
  assessment?: string;
}
