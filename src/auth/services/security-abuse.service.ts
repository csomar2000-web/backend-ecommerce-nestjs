import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 30;

const SENSITIVE_LIMIT = 3;
const SENSITIVE_WINDOW_MINUTES = 60;

type SensitiveActionType =
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFICATION';

@Injectable()
export class SecurityAbuseService {
  constructor(private readonly prisma: PrismaService) { }

  async assertLoginAllowed(params: { identifier: string }) {
    const now = new Date();

    const activeBlock = await this.prisma.rateLimit.findFirst({
      where: {
        identifier: params.identifier,
        action: 'LOGIN_BLOCK',
        expiresAt: { gt: now },
      },
    });

    if (activeBlock) {
      throw new ForbiddenException('Temporarily blocked');
    }

    const windowStart = new Date(
      now.getTime() - LOGIN_WINDOW_MINUTES * 60 * 1000,
    );

    const attempts = await this.prisma.rateLimit.count({
      where: {
        identifier: params.identifier,
        action: 'LOGIN',
        windowStart: { gte: windowStart },
      },
    });

    if (attempts >= LOGIN_LIMIT) {
      await this.blockIdentifier(params.identifier);
      throw new ForbiddenException('Temporarily blocked');
    }
  }

  async recordFailedLogin(params: {
    identifier: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const now = new Date();

    await this.prisma.rateLimit.create({
      data: {
        identifier: params.identifier,
        action: 'LOGIN',
        windowStart: now,
        expiresAt: new Date(
          now.getTime() + LOGIN_WINDOW_MINUTES * 60 * 1000,
        ),
      },
    });
  }

  async clearLoginFailures(identifier: string) {
    await this.prisma.rateLimit.deleteMany({
      where: {
        identifier,
        action: 'LOGIN',
      },
    });
  }

  async blockIdentifier(identifier: string) {
    const now = new Date();

    await this.prisma.rateLimit.create({
      data: {
        identifier,
        action: 'LOGIN_BLOCK',
        windowStart: now,
        expiresAt: new Date(
          now.getTime() + BLOCK_MINUTES * 60 * 1000,
        ),
      },
    });
  }

  async assertSensitiveActionAllowed(params: {
    identifier: string;
    type: SensitiveActionType;
  }) {
    const now = new Date();

    const windowStart = new Date(
      now.getTime() - SENSITIVE_WINDOW_MINUTES * 60 * 1000,
    );

    const attempts = await this.prisma.rateLimit.count({
      where: {
        identifier: params.identifier,
        action: params.type,
        windowStart: { gte: windowStart },
      },
    });

    if (attempts >= SENSITIVE_LIMIT) {
      throw new ForbiddenException('Too many requests');
    }

    await this.prisma.rateLimit.create({
      data: {
        identifier: params.identifier,
        action: params.type,
        windowStart: now,
        expiresAt: new Date(
          now.getTime() + SENSITIVE_WINDOW_MINUTES * 60 * 1000,
        ),
      },
    });
  }
}
