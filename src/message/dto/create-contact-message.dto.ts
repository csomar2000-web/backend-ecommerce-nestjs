import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateContactMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @IsEmail()
  @MaxLength(255)
  email: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(150)
  subject?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string
}
