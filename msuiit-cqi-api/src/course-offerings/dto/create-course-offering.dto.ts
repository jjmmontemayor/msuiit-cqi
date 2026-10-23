import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseOfferingDto {
  @IsUUID()
  courseId!: string;

  @IsUUID()
  academicTermId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  section?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  instructorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  modality?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  population?: number | null;

  @IsOptional()
  @IsString()
  references?: string | null;

  @IsOptional()
  @IsString()
  classroomPolicies?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  preparedBy?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reviewedBy?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  approvedBy?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  courseworkWeight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  syllabusCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  syllabusTitle?: string | null;

  @IsOptional()
  @IsString()
  syllabusDescription?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  syllabusCredits?: number | null;

  @IsOptional()
  @IsString()
  syllabusPrerequisites?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  syllabusTerm?: string | null;

  // Archived plans are hidden from the learning plan lists but keep their data.
  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsString()
  blueprintNote?: string | null;

  @IsOptional()
  @IsString()
  gradingNote?: string | null;

  // [{ min, max, grade }]; null restores the default scale.
  @IsOptional()
  @IsArray()
  gradeScale?: { min: number; max: string; grade: string }[] | null;
}
