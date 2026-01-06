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
    deviceId?: string;
    deviceName?: string;
  }) {
    const activeSessions = await this.prisma.session.count({
      where: { userId: params.userId, isActive: true },
    });

    if (activeSessions >= MAX_ACTIVE_SESSIONS) {
      const oldestSession = await this.prisma.session.findFirst({
        where: { userId: params.userId, isActive: true },
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
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        deviceId: params.deviceId,
        deviceName: params.deviceName,
        expiresAt: new Date(
          Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });
  }

  async listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { lastActivityAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceId: true,
        deviceName: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
        lastActivityAt: true,
      },
    });
  }

  async revokeSession(params: {
    userId: string;
    sessionId: string;
    accessToken: string;
  }) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: params.sessionId,
        userId: params.userId,
        isActive: true,
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
    await this.tokenService.blacklistAccessTokenFromJwt(
      params.accessToken,
      'USER_LOGOUT_ALL',
    );

    const sessions = await this.prisma.session.findMany({
      where: {
        userId: params.userId,
        isActive: true,
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

    await this.prisma.userAuditLog.create({
      data: {
        userId: params.userId,
        eventType: 'AUTH',
        eventAction: 'SESSION_INVALIDATED',
        sessionId: params.sessionId,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: true,
        metadata: { reason: params.reason },
      },
    });
  }
}
