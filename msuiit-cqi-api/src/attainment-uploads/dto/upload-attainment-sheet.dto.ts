import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Semester } from '@prisma/client';

// Multipart form fields alongside the uploaded file. Numbers arrive as
// strings over multipart/form-data, hence the Transform coercions.
export class UploadAttainmentSheetDto {
  @IsUUID()
  programId!: string;

  @IsOptional()
  @IsUUID()
  academicTermId?: string;

  // Provided together to create a new term instead of reusing an existing
  // one (see AttainmentUploadsController: newTerm fields take precedence
  // over academicTermId when present).
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  newTermSchoolYearStart?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  newTermSchoolYearEnd?: number;

  @IsOptional()
  @IsEnum(Semester)
  newTermSemester?: Semester;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  newTermLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  section?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(10)
  yearLevel?: number;
}
