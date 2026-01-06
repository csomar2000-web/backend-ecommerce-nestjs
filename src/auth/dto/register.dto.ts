import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  confirmPassword: string;

  @IsPhoneNumber(undefined)
  phoneNumber: string;
}
