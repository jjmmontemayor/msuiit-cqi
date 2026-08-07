import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @MaxLength(20)
  code!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  credits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lectureHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  labHours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  prerequisites?: string;
}
