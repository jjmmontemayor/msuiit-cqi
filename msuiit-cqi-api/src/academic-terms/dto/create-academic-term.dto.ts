import { IsEnum, IsInt, IsString, MaxLength } from 'class-validator';
import { Semester } from '@prisma/client';

export class CreateAcademicTermDto {
  @IsInt()
  schoolYearStart!: number;

  @IsInt()
  schoolYearEnd!: number;

  @IsEnum(Semester)
  semester!: Semester;

  @IsString()
  @MaxLength(50)
  label!: string;
}
