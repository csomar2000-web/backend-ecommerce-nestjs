import { IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  @Length(6, 8)
  code: string;
}
