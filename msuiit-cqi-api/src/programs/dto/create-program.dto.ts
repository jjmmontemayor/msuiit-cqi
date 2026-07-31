import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @MaxLength(20)
  code!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
