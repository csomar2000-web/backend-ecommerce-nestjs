import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      issuer: 'auth-service',
      audience: 'api',
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        isActive: true,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session invalid');
    }

    return {
      userId: payload.sub,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}
