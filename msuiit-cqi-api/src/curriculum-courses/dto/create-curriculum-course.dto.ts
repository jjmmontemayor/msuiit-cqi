import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCurriculumCourseDto {
  @IsUUID()
  programId!: string;

  @IsUUID()
  courseId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  electiveGroup?: string;

  @IsOptional()
  @IsInt()
  yearLevel?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  term?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
