import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

enum ReplyChannelDto {
    EMAIL = 'EMAIL',
    DASHBOARD = 'DASHBOARD',
}

export class ReplyToContactMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    content: string

    @IsOptional()
    @IsEnum(ReplyChannelDto)
    channel?: ReplyChannelDto
}
