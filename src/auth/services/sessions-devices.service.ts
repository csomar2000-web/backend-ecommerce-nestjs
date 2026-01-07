import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../token/token.service';

const MAX_ACTIVE_SESSIONS = 10;
const SESSION_TTL_DAYS = 30;

@Injectable()
export class SessionsDevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) { }

  async createSession(params: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    deviceInfo?: string;
  }) {
    const now = new Date();

    const activeSessions = await this.prisma.session.count({
      where: {
        userId: params.userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (activeSessions >= MAX_ACTIVE_SESSIONS) {
      const oldestSession = await this.prisma.session.findFirst({
        where: {
          userId: params.userId,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (oldestSession) {
        await this.invalidateSession({
          userId: params.userId,
          sessionId: oldestSession.id,
          reason: 'SESSION_LIMIT_REACHED',
        });
      }
    }

    return this.prisma.session.create({
      data: {
        userId: params.userId,
        sessionToken: crypto.randomUUID(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        deviceInfo: params.deviceInfo,
        expiresAt: new Date(
          Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });
  }

  async listSessions(userId: string) {
    const now = new Date();

    return this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceInfo: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  async revokeSession(params: {
    userId: string;
    sessionId: string;
    accessToken: string;
  }) {
    const now = new Date();

    const session = await this.prisma.session.findFirst({
      where: {
        id: params.sessionId,
        userId: params.userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (!session) {
      throw new ForbiddenException();
    }

    await this.tokenService.blacklistAccessTokenFromJwt(
      params.accessToken,
      'USER_REVOKED_SESSION',
    );

    await this.invalidateSession({
      userId: params.userId,
      sessionId: params.sessionId,
      reason: 'USER_REVOKED_SESSION',
    });

    return { success: true };
  }

  async logoutCurrentSession(params: {
    userId: string;
    sessionId: string;
    accessToken: string;
  }) {
    await this.tokenService.blacklistAccessTokenFromJwt(
      params.accessToken,
      'USER_LOGOUT',
    );

    await this.invalidateSession({
      userId: params.userId,
      sessionId: params.sessionId,
      reason: 'USER_LOGOUT',
    });

    return { success: true };
  }

  async logoutAllSessions(params: {
    userId: string;
    accessToken: string;
  }) {
    const now = new Date();

    await this.tokenService.blacklistAccessTokenFromJwt(
      params.accessToken,
      'USER_LOGOUT_ALL',
    );

    const sessions = await this.prisma.session.findMany({
      where: {
        userId: params.userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true },
    });

    for (const session of sessions) {
      await this.invalidateSession({
        userId: params.userId,
        sessionId: session.id,
        reason: 'USER_LOGOUT_ALL',
      });
    }

    return { success: true };
  }

  private async invalidateSession(params: {
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
        action: 'SESSION_INVALIDATED',
        resource: 'SESSION',
        resourceId: params.sessionId,
        success: true,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        metadata: { reason: params.reason },
      },
    });
  }
}
