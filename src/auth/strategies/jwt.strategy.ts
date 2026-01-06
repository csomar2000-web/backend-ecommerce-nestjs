import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../token/token.service';

export interface JwtPayload {
  sub: string;
  role: string;
  sessionId: string;
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface AuthenticatedUser {
  userId: string;
  role: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      issuer: 'auth-service',
      audience: 'api',
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub || !payload?.sessionId || !payload?.jti) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const isBlacklisted =
      await this.tokenService.isAccessTokenBlacklisted(payload.jti);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token revoked');
    }

    const session = await this.prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        isActive: true,
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.expiresAt <= new Date()) {
      await this.prisma.session.updateMany({
        where: { id: session.id, isActive: true },
        data: {
          isActive: false,
          invalidatedAt: new Date(),
          invalidationReason: 'SESSION_EXPIRED',
        },
      });

      throw new UnauthorizedException('Session expired');
    }

    return {
      userId: payload.sub,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}
