import { IsString, Length, Matches } from 'class-validator';

export class MfaDisableDto {
  @IsString()
  @Length(6, 12)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Invalid MFA or recovery code',
  })
  code: string;
}
