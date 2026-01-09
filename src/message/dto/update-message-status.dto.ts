import { IsEnum } from 'class-validator'
import { MessageStatus } from '@prisma/client'
import { IsIn } from 'class-validator'

export class UpdateMessageStatusDto {
    @IsEnum(MessageStatus)
    @IsIn([MessageStatus.READ, MessageStatus.ARCHIVED, MessageStatus.SPAM])
    status: MessageStatus
}
