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
  constructor(private readonly auth: AuthService) { }

  @Post('register')
  register(@Body() dto: any, @Req() req: Request) {
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
  login(@Body() dto: any, @Req() req: Request) {
    return this.auth.login({
      ...dto,
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @Post('refresh')
  refresh(@Body() dto: any, @Req() req: Request) {
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
  logout(@Req() req: any) {
    const accessToken = this.extractAccessToken(req);

    return this.auth.logout({
      userId: req.user.userId,
      sessionId: req.user.sessionId,
      accessToken,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAll(@Req() req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedException();

    return this.auth.logoutAll({
      userId: req.user.userId,
      accessToken: authHeader.replace('Bearer ', ''),
    });
  }


  @Post('password-reset')
  requestPasswordReset(@Body() dto: any, @Req() req: Request) {
    return this.auth.requestPasswordReset({
      ...dto,
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
  }

  @Post('password-reset/confirm')
  confirmPasswordReset(@Body() dto: any) {
    return this.auth.confirmPasswordReset(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('password-change')
  changePassword(@Req() req: any, @Body() dto: any) {
    return this.auth.changePassword({
      userId: req.user.userId,
      ...dto,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  listSessions(@Req() req: any) {
    return this.auth.listSessions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke')
  revokeSession(
    @Req() req: any,
    @Body('sessionId') sessionId: string,
  ) {
    const accessToken = this.extractAccessToken(req);

    return this.auth.revokeSession({
      userId: req.user.userId,
      sessionId,
      accessToken,
    });
  }

  private extractAccessToken(req: Request): string {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    return header.slice(7);
  }
}
