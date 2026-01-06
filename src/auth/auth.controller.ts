import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto, @Req() req: Request) {
    return this.auth.register({
      ...dto,
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @Post('verify-email')
  verifyEmail(@Body('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  @Post('resend-verification')
  resendVerification(@Body('email') email: string) {
    return this.auth.resendVerification(email);
  }

  @Post('login')
  login(@Body() dto, @Req() req: Request) {
    return this.auth.login({
      ...dto,
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @Post('refresh')
  refresh(@Body() dto, @Req() req: Request) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException();
    }

    return this.auth.refresh({
      refreshToken: dto.refreshToken,
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req) {
    return this.auth.logout({
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAll(@Req() req) {
    return this.auth.logoutAll({
      userId: req.user.userId,
    });
  }

  @Post('password-reset')
  requestPasswordReset(@Body() dto, @Req() req: Request) {
    return this.auth.requestPasswordReset({
      ...dto,
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @Post('password-reset/confirm')
  confirmPasswordReset(@Body() dto) {
    return this.auth.confirmPasswordReset(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('password-change')
  changePassword(@Req() req, @Body() dto) {
    return this.auth.changePassword({
      userId: req.user.userId,
      ...dto,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  listSessions(@Req() req) {
    return this.auth.listSessions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke')
  revokeSession(@Req() req, @Body('sessionId') sessionId: string) {
    return this.auth.revokeSession({
      userId: req.user.userId,
      sessionId,
    });
  }
}
