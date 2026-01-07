import { IsString, Matches } from 'class-validator';

export class MfaRecoveryCodeDto {
  @IsString()
  @Matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  recoveryCode: string;
}
