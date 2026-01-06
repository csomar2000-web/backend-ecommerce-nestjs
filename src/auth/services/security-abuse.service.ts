import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 30;

@Injectable()
export class SecurityAbuseService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async assertLoginAllowed(params: {
    identifier: string;
  }) {
    const now = new Date();

    const activeBlock = await this.prisma.rateLimit.findFirst({
      where: {
        identifier: params.identifier,
        isBlocked: true,
        blockedUntil: { gt: now },
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
        limitType: 'LOGIN',
        windowStart: { gte: windowStart },
      },
    });

    if (attempts >= LOGIN_LIMIT) {
      await this.blockIdentifier(params.identifier);
      throw new ForbiddenException('Temporarily blocked');
    }

    return true;
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
        limitType: 'LOGIN',
        windowStart: now,
        windowEnd: new Date(
          now.getTime() + LOGIN_WINDOW_MINUTES * 60 * 1000,
        ),
      },
    });

    await this.prisma.securityEvent.create({
      data: {
        email: params.identifier,
        eventType: 'BRUTE_FORCE',
        severity: 'HIGH',
        description: 'Failed login attempt',
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async clearLoginFailures(identifier: string) {
    await this.prisma.rateLimit.deleteMany({
      where: {
        identifier,
        limitType: 'LOGIN',
      },
    });
  }

  async blockIdentifier(identifier: string) {
    const now = new Date();

    await this.prisma.rateLimit.create({
      data: {
        identifier,
        limitType: 'LOGIN_BLOCK',
        windowStart: now,
        windowEnd: new Date(
          now.getTime() + BLOCK_MINUTES * 60 * 1000,
        ),
        isBlocked: true,
        blockedUntil: new Date(
          now.getTime() + BLOCK_MINUTES * 60 * 1000,
        ),
      },
    });

    await this.prisma.securityEvent.create({
      data: {
        email: identifier,
        eventType: 'ACCOUNT_LOCKOUT',
        severity: 'CRITICAL',
        description: 'Account temporarily locked',
        ipAddress: 'unknown',
        userAgent: 'unknown',
      },
    });
  }

  async unblockExpired() {
    const now = new Date();

    await this.prisma.rateLimit.updateMany({
      where: {
        isBlocked: true,
        blockedUntil: { lt: now },
      },
      data: {
        isBlocked: false,
        blockedUntil: null,
      },
    });
  }
}
