import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateContactMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    name: string

    @IsEmail()
    @MaxLength(255)
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string

    @IsOptional()
    @IsString()
    @MaxLength(30)
    @Transform(({ value }) => value?.trim())
    phone?: string

    @IsOptional()
    @IsString()
    @MaxLength(150)
    @Transform(({ value }) => value?.trim())
    subject?: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    @Transform(({ value }) => value?.trim())
    message: string
}
