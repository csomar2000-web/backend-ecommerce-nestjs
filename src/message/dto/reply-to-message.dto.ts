import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class ReplyToContactMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string

  @IsOptional()
  @IsString()
  channel?: 'EMAIL' | 'DASHBOARD'
}
