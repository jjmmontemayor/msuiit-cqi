import {
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
}
