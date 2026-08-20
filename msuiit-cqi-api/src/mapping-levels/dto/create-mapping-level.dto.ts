import { IsInt, IsOptional, IsString, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateMappingLevelDto {
  @IsUUID()
  programId!: string;

  @IsString()
  @MaxLength(20)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  displayCode?: string;

  @IsString()
  @MaxLength(50)
  label!: string;

  @IsInt()
  @Min(1)
  weight!: number;
}
