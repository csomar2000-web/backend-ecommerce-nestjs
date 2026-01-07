import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])/, {
    message: 'Password must contain upper, lower, number, and special character',
  })
  password: string;

  @IsString()
  confirmPassword: string;

  @IsString()
  phoneNumber: string;
}
