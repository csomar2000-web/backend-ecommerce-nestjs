import { IsString, Length, Matches } from 'class-validator';

export class MfaRecoveryCodeDto {

  @IsString()
  @Length(9, 11)
  @Matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, {
    message: 'Invalid recovery code format',
  })
  recoveryCode: string;
}
