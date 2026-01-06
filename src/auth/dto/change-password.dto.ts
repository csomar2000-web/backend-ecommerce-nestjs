import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  currentPassword: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  confirmPassword: string;
}
