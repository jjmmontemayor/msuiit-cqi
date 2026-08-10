import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  courseOfferingId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  yearLevel?: number;
}
