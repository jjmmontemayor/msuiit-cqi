import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
}
