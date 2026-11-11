import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderPlosDto {
  @IsUUID()
  programId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids!: string[];
}
