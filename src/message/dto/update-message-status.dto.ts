import { IsEnum } from 'class-validator'
import { MessageStatus } from '@prisma/client'

export class UpdateMessageStatusDto {
  @IsEnum(MessageStatus)
  status: MessageStatus
}
