import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  @IsString()
  @MaxLength(20)
  studentNumber!: string;

  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsUUID()
  programId!: string;

  @IsOptional()
  @IsUUID()
  cohortId?: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
