import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AuthMetadataDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceName?: string;
}
