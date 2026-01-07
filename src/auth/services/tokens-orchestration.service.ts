import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { MfaType, MfaChallengeReason } from '@prisma/client';

@Injectable()
export class TokensOrchestrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) { }

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

    const now = new Date();

    const session = await this.prisma.session.findFirst({
      where: {
        id: rotation.sessionId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session invalid');
    }

    const requiresMfa = await this.requiresMfaOnRefresh({
      userId: rotation.userId,
      session,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    if (requiresMfa) {
      await this.prisma.mfaChallenge.upsert({
        where: {
          sessionId_factorType: {
            sessionId: session.id,
            factorType: MfaType.TOTP,
          },
        },
        update: {
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          satisfied: false,
          reason: MfaChallengeReason.SENSITIVE_ACTION,
        },
        create: {
          userId: rotation.userId,
          sessionId: session.id,
          factorType: MfaType.TOTP,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          reason: MfaChallengeReason.SENSITIVE_ACTION,
        },
      });

      return {
        mfaRequired: true,
        reason: MfaChallengeReason.SENSITIVE_ACTION,
        sessionId: session.id,
      };
    }

    const roleAssignment =
      await this.prisma.userRoleAssignment.findFirst({
        where: {
          userId: rotation.userId,
          revokedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
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
        action: 'TOKEN_REFRESH',
        resource: 'SESSION',
        resourceId: rotation.sessionId,
        success: true,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: rotation.refreshToken,
    };
  }

  private async requiresMfaOnRefresh(params: {
    userId: string;
    session: {
      ipAddress: string | null;
      userAgent: string | null;
    };
    ipAddress: string;
    userAgent: string;
  }) {
    const mfaFactor = await this.prisma.mfaFactor.findFirst({
      where: {
        userId: params.userId,
        revokedAt: null,
      },
    });

    if (!mfaFactor) return false;

    if (
      params.session.ipAddress !== params.ipAddress ||
      params.session.userAgent !== params.userAgent
    ) {
      return true;
    }

    return false;
  }

  async revokeSession(params: {
    userId: string;
    sessionId: string;
    reason: string;
  }) {
    await this.tokenService.invalidateSession(
      params.sessionId,
      params.reason,
    );

    await this.prisma.session.update({
      where: { id: params.sessionId },
      data: { revokedAt: new Date() },
    });

    await this.prisma.userAuditLog.create({
      data: {
        userId: params.userId,
        action: 'TOKEN_REVOKE',
        resource: 'SESSION',
        resourceId: params.sessionId,
        success: true,
        metadata: { reason: params.reason },
      },
    });

    return { success: true };
  }

  async revokeAllSessions(params: {
    userId: string;
    reason: string;
  }) {
    const now = new Date();

    const sessions = await this.prisma.session.findMany({
      where: {
        userId: params.userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true },
    });

    for (const session of sessions) {
      await this.tokenService.invalidateSession(
        session.id,
        params.reason,
      );

      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }

    await this.prisma.userAuditLog.create({
      data: {
        userId: params.userId,
        action: 'TOKEN_REVOKE_ALL',
        success: true,
        metadata: { reason: params.reason },
      },
    });

    return { success: true };
  }

  async detectBlacklistedAccessToken(token: string) {
    const record = await this.prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    if (record && record.expiresAt > new Date()) {
      throw new ForbiddenException('Token revoked');
    }

    return true;
  }
}
