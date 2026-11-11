import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePloDto {
  @IsUUID()
  programId!: string;

  // Ignored: the code is generated from the PLO's position (PLO01, PLO02, ...).
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsString()
  description!: string;

  // Ignored: new PLOs are appended; reorder with POST /plos/reorder.
  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
