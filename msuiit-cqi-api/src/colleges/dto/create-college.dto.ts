import { IsString, MaxLength } from 'class-validator';

export class CreateCollegeDto {
  @IsString()
  @MaxLength(20)
  code!: string;

  @IsString()
  @MaxLength(255)
  name!: string;
}
