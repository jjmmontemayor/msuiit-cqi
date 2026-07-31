import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class CreateAttainmentDto {
  @IsUUID()
  enrollmentId!: string;

  @IsUUID()
  cloId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;
}
