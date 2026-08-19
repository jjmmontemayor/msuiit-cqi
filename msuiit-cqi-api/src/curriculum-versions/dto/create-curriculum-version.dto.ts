import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCurriculumVersionDto {
  @IsUUID()
  programId!: string;

  @IsString()
  @MaxLength(20)
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
