import { IsString, MinLength } from 'class-validator';

export class PasswordResetConfirmDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(12)
  password: string;
}
