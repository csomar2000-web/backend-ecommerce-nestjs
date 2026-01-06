import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../token/token.service';

@Injectable()
export class TokensOrchestrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) { }

  /* ------------------------------------------------------------------
   * ISSUE TOKENS
   * ------------------------------------------------------------------ */

  async issueTokens(params: {
    userId: string;
    role: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const accessToken = this.tokenService.generateAccessToken(
      params.userId,
      params.role,
      params.sessionId,
    );

    const { refreshToken } =
      await this.tokenService.generateRefreshToken({
        userId: params.userId,
        sessionId: params.sessionId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });

    return { accessToken, refreshToken };
  }

  /* ------------------------------------------------------------------
   * REFRESH TOKENS
   * ------------------------------------------------------------------ */

  async refreshTokens(params: {
    refreshToken: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const rotation =
      await this.tokenService.rotateRefreshToken({
        refreshToken: params.refreshToken,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });

    const session = await this.prisma.session.findFirst({
      where: {
        id: rotation.sessionId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session invalid');
    }

    const roleAssignment =
      await this.prisma.userRoleAssignment.findFirst({
        where: {
          userId: rotation.userId,
          isActive: true,
        },
        include: { role: true },
      });

    const accessToken = this.tokenService.generateAccessToken(
      rotation.userId,
      roleAssignment?.role.name ?? 'CUSTOMER',
      rotation.sessionId,
    );

    await this.prisma.userAuditLog.create({
      data: {
        userId: rotation.userId,
        eventType: 'AUTH',
        eventAction: 'TOKEN_REFRESH',
        sessionId: rotation.sessionId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        success: true,
      },
    });

    return {
      accessToken,
      refreshToken: rotation.refreshToken,
    };
  }

  /* ------------------------------------------------------------------
   * REVOKE SESSION
   * ------------------------------------------------------------------ */

  async revokeSession(params: {
    userId: string;
    sessionId: string;
    reason: string;
  }) {
    await this.tokenService.invalidateSession(
      params.sessionId,
      params.reason,
    );

    await this.prisma.userAuditLog.create({
      data: {
        userId: params.userId,
        eventType: 'AUTH',
        eventAction: 'TOKEN_REVOKE',
        sessionId: params.sessionId,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: true,
        metadata: { reason: params.reason },
      },
    });

    return { success: true };
  }

  /* ------------------------------------------------------------------
   * REVOKE ALL SESSIONS
   * ------------------------------------------------------------------ */

  async revokeAllSessions(params: {
    userId: string;
    reason: string;
  }) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId: params.userId,
        isActive: true,
      },
      select: { id: true },
    });

    for (const session of sessions) {
      await this.tokenService.invalidateSession(
        session.id,
        params.reason,
      );
    }

    await this.prisma.userAuditLog.create({
      data: {
        userId: params.userId,
        eventType: 'AUTH',
        eventAction: 'TOKEN_REVOKE_ALL',
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: true,
        metadata: { reason: params.reason },
      },
    });

    return { success: true };
  }

  /* ------------------------------------------------------------------
   * MAINTENANCE
   * ------------------------------------------------------------------ */

  async cleanupExpiredTokens() {
    const now = new Date();

    await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    await this.prisma.session.updateMany({
      where: { expiresAt: { lt: now } },
      data: {
        isActive: false,
        invalidatedAt: now,
        invalidationReason: 'SESSION_EXPIRED',
      },
    });

    return { success: true };
  }

  /* ------------------------------------------------------------------
   * BLACKLIST CHECK
   * ------------------------------------------------------------------ */

  async detectBlacklistedAccessToken(tokenHash: string) {
    const record = await this.prisma.tokenBlacklist.findUnique({
      where: { tokenHash },
    });

    if (record && record.expiresAt > new Date()) {
      throw new ForbiddenException('Token revoked');
    }

    return true;
  }
}
