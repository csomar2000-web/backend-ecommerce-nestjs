import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(
        @Body() dto: RegisterDto,
        @Req() req: Request,
    ) {
        return this.authService.register({
            email: dto.email,
            password: dto.password,
            confirmPassword: dto.confirmPassword,
            phoneNumber: dto.phoneNumber,
            ipAddress: req.ip ?? 'unknown',
            userAgent: req.headers['user-agent'] ?? 'unknown',
        });
    }

    @Post('login')
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        return this.authService.login({
            email: dto.email,
            password: dto.password,
            ipAddress: req.ip ?? 'unknown',
            userAgent: req.headers['user-agent'] ?? 'unknown',
        });
    }
}
