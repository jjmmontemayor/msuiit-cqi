import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { EvaluationStatus } from '@prisma/client';

export class CreateEvaluationDto {
  @IsUUID()
  piId!: string;

  @IsUUID()
  cohortId!: string;

  @IsOptional()
  @IsString()
  benchmarkDescription?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetPercentage?: number;

  @IsOptional()
  @IsString()
  resultsNarrative?: string;

  @IsOptional()
  @IsEnum(EvaluationStatus)
  status?: EvaluationStatus;

  @IsOptional()
  @IsUUID()
  createdById?: string;
}
