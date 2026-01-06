import { IsEnum, IsOptional, IsPhoneNumber, IsEmail } from 'class-validator';
import { MfaMethod } from './mfa.types';

export class MfaSetupDto {
  @IsEnum(MfaMethod)
  method: MfaMethod;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
