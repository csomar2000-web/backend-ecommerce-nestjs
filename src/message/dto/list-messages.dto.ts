import { IsEnum, IsOptional, IsString } from 'class-validator'
import { MessageStatus } from '@prisma/client'

export class ListContactMessagesDto {
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus

  @IsOptional()
  @IsString()
  search?: string
}
