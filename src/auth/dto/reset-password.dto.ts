import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  confirmPassword: string;
}
