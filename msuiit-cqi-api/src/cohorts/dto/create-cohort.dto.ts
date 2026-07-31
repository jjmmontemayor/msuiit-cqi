import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCohortDto {
  @IsUUID()
  programId!: string;

  @IsString()
  @MaxLength(20)
  code!: string;

  @IsInt()
  startYear!: number;

  @IsInt()
  endYear!: number;

  @IsOptional()
  @IsString()
  description?: string;
}
