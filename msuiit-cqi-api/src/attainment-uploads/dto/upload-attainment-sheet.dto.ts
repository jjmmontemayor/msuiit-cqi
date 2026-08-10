import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Semester } from '@prisma/client';

// Multipart form fields alongside the uploaded file. Numbers arrive as
// strings over multipart/form-data, hence the Transform coercions.
export class UploadAttainmentSheetDto {
  @IsUUID()
  programId!: string;

  // The faculty uploading picks an academic year + semester from what an
  // admin has already set up (see AcademicTermsController) -- this is a
  // lookup, not a create. Either pass academicTermId directly, or
  // schoolYearStart/schoolYearEnd/semester for the service to resolve.
  @IsOptional()
  @IsUUID()
  academicTermId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  schoolYearStart?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  schoolYearEnd?: number;

  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  section?: string;
}
