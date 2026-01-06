import { IsString, MinLength } from 'class-validator';

export class PasswordChangeDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(12)
  newPassword: string;
}
