import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Semester } from '@prisma/client';

export class CreateAcademicTermDto {
  @IsInt()
  schoolYearStart!: number;

  @IsInt()
  schoolYearEnd!: number;

  @IsEnum(Semester)
  semester!: Semester;

  // Auto-generated from the academic year + semester when omitted.
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;
}
