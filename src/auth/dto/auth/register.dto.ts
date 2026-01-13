import {
  IsEmail,
  IsString,
  IsPhoneNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { MatchFields } from '../../../common/validators/match-fields.validator';
import { StrongPassword } from '../common/password-rules';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @StrongPassword()
  password: string;

  @IsString()
  @MatchFields('password', {
    message: 'Passwords do not match',
  })
  confirmPassword: string;

  @IsOptional()
  @IsPhoneNumber(undefined)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'Username can contain letters, numbers, dots, underscores, and dashes',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;
}
