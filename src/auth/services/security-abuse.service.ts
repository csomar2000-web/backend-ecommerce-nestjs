import {
  Injectable,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthProvider } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

const DEFAULT_LOGIN_LIMIT = 5;
const DEFAULT_LOGIN_WINDOW_MINUTES = 15;
const DEFAULT_LOGIN_BLOCK_MINUTES = 30;

const DEFAULT_REGISTRATION_LIMIT = 5;
const DEFAULT_REGISTRATION_WINDOW_MINUTES = 60;
const DEFAULT_REGISTRATION_BLOCK_MINUTES = 30;

const DEFAULT_SENSITIVE_LIMIT = 3;
const DEFAULT_SENSITIVE_WINDOW_MINUTES = 60;

type SensitiveActionType =
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFICATION'
  | 'MFA_SETUP';

function bucket(date: Date, minutes: number) {
  const ms = minutes * 60 * 1000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

function passwordLoginIdentifiers(email: string, ip: string) {
  return [
    `login:email:${email}`,
    `login:ip:${ip}`,
    `login:email_ip:${email}:${ip}`,
  ];
}

function registrationIdentifiers(email: string, ip: string) {
  return [
    `register:email:${email}`,
    `register:ip:${ip}`,
    `register:email_ip:${email}:${ip}`,
  ];
}

function socialLoginIdentifiers(params: {
  provider: AuthProvider;
  providerUserId: string;
  email?: string | null;
  ipAddress: string;
}) {
  const ids = [
    `social:${params.provider}:user:${params.providerUserId}`,
    `social:${params.provider}:ip:${params.ipAddress}`,
  ];

  if (params.email) {
    ids.push(`social:${params.provider}:email:${params.email}`);
    ids.push(
      `social:${params.provider}:email_ip:${params.email}:${params.ipAddress}`,
    );
  }

  return ids;
}

@Injectable()
export class SecurityAbuseService {
  private readonly logger = new Logger(SecurityAbuseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) { }

  private getNumber(key: string, fallback: number) {
    const value = this.config.get<number>(key);
    return value === undefined || value === null ? fallback : Number(value);
  }

  private get loginLimit() {
    return this.getNumber('LOGIN_LIMIT', DEFAULT_LOGIN_LIMIT);
  }

  private get loginWindowMinutes() {
    return this.getNumber(
      'LOGIN_WINDOW_MINUTES',
      DEFAULT_LOGIN_WINDOW_MINUTES,
    );
  }

  private get loginBlockMinutes() {
    return this.getNumber(
      'LOGIN_BLOCK_MINUTES',
      DEFAULT_LOGIN_BLOCK_MINUTES,
    );
  }

  private get registrationLimit() {
    return this.getNumber(
      'REGISTRATION_LIMIT',
      DEFAULT_REGISTRATION_LIMIT,
    );
  }

  private get registrationWindowMinutes() {
    return this.getNumber(
      'REGISTRATION_WINDOW_MINUTES',
      DEFAULT_REGISTRATION_WINDOW_MINUTES,
    );
  }

  private get registrationBlockMinutes() {
    return this.getNumber(
      'REGISTRATION_BLOCK_MINUTES',
      DEFAULT_REGISTRATION_BLOCK_MINUTES,
    );
  }

  private get sensitiveLimit() {
    return this.getNumber('SENSITIVE_LIMIT', DEFAULT_SENSITIVE_LIMIT);
  }

  private get sensitiveWindowMinutes() {
    return this.getNumber(
      'SENSITIVE_WINDOW_MINUTES',
      DEFAULT_SENSITIVE_WINDOW_MINUTES,
    );
  }

  private secondsUntil(date: Date, now = new Date()) {
    return Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 1000));
  }

  private async assertIdentifiersAllowed(identifiers: string[]) {
    const now = new Date();
    const windowStart = bucket(now, this.loginWindowMinutes);

    for (const identifier of identifiers) {
      const activeBlock = await this.prisma.rateLimit.findFirst({
        where: {
          identifier,
          action: 'LOGIN_BLOCK',
          expiresAt: { gt: now },
        },
      });

      if (activeBlock) {
        throw new ForbiddenException('Temporarily blocked');
      }

      const record = await this.prisma.rateLimit.findUnique({
        where: {
          identifier_action_windowStart: {
            identifier,
            action: 'LOGIN',
            windowStart,
          },
        },
      });

      if ((record?.count ?? 0) >= this.loginLimit) {
        await this.blockLoginIdentifier(identifier, now);
        throw new ForbiddenException('Temporarily blocked');
      }
    }
  }

  private async recordFailure(
    identifiers: string[],
    action: 'LOGIN' | 'REGISTER',
    windowMinutes: number,
  ) {
    const now = new Date();
    const windowStart = bucket(now, windowMinutes);

    for (const identifier of identifiers) {
      await this.prisma.rateLimit.upsert({
        where: {
          identifier_action_windowStart: {
            identifier,
            action,
            windowStart,
          },
        },
        create: {
          identifier,
          action,
          windowStart,
          expiresAt: new Date(
            windowStart.getTime() + windowMinutes * 60 * 1000,
          ),
          count: 1,
        },
        update: {
          count: { increment: 1 },
        },
      });
    }
  }

  async assertLoginAllowed(params: { email: string; ipAddress: string }) {
    const ids = passwordLoginIdentifiers(
      params.email,
      params.ipAddress,
    );
    await this.assertIdentifiersAllowed(ids);
  }

  async recordFailedLogin(params: { email: string; ipAddress: string }) {
    const ids = passwordLoginIdentifiers(
      params.email,
      params.ipAddress,
    );
    await this.recordFailure(ids, 'LOGIN', this.loginWindowMinutes);
  }

  async clearLoginFailures(email: string, ipAddress: string) {
    const ids = passwordLoginIdentifiers(email, ipAddress);

    await this.prisma.rateLimit.deleteMany({
      where: {
        identifier: { in: ids },
        action: 'LOGIN',
      },
    });
  }

  async assertRegistrationAllowed(params: {
    email: string;
    ipAddress: string;
  }) {
    const now = new Date();
    const windowStart = bucket(now, this.registrationWindowMinutes);

    const ids = registrationIdentifiers(
      params.email.toLowerCase().trim(),
      params.ipAddress,
    );

    for (const identifier of ids) {
      const activeBlock = await this.prisma.rateLimit.findFirst({
        where: {
          identifier,
          action: 'REGISTER_BLOCK',
          expiresAt: { gt: now },
        },
      });

      if (activeBlock) {
        throw new HttpException(
          {
            message: 'Too many registration attempts',
            retryAfterSeconds: this.secondsUntil(activeBlock.expiresAt, now),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const record = await this.prisma.rateLimit.findUnique({
        where: {
          identifier_action_windowStart: {
            identifier,
            action: 'REGISTER',
            windowStart,
          },
        },
      });

      if ((record?.count ?? 0) >= this.registrationLimit) {
        const block = await this.blockRegistrationIdentifier(identifier, now);
        throw new HttpException(
          {
            message: 'Too many registration attempts',
            retryAfterSeconds: this.secondsUntil(block.expiresAt, now),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      await this.recordFailure(
        [identifier],
        'REGISTER',
        this.registrationWindowMinutes,
      );
    }
  }

  async assertSocialLoginAllowed(identifiers: string[]) {
    await this.assertIdentifiersAllowed(identifiers);
  }

  async recordFailedSocialLogin(identifiers: string[]) {
    await this.recordFailure(
      identifiers,
      'LOGIN',
      this.loginWindowMinutes,
    );
  }

  buildSocialIdentifiers(params: {
    provider: AuthProvider;
    providerUserId: string;
    email?: string | null;
    ipAddress: string;
  }) {
    return socialLoginIdentifiers(params);
  }

  private async blockLoginIdentifier(identifier: string, now: Date) {
    const windowStart = bucket(now, this.loginBlockMinutes);
    const expiresAt = new Date(
      windowStart.getTime() + this.loginBlockMinutes * 60 * 1000,
    );

    await this.prisma.rateLimit.upsert({
      where: {
        identifier_action_windowStart: {
          identifier,
          action: 'LOGIN_BLOCK',
          windowStart,
        },
      },
      create: {
        identifier,
        action: 'LOGIN_BLOCK',
        windowStart,
        expiresAt,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    this.logger.warn(`Login identifier blocked: ${identifier}`);
  }

  private async blockRegistrationIdentifier(identifier: string, now: Date) {
    const windowStart = bucket(now, this.registrationBlockMinutes);
    const expiresAt = new Date(
      windowStart.getTime() + this.registrationBlockMinutes * 60 * 1000,
    );

    const record = await this.prisma.rateLimit.upsert({
      where: {
        identifier_action_windowStart: {
          identifier,
          action: 'REGISTER_BLOCK',
          windowStart,
        },
      },
      create: {
        identifier,
        action: 'REGISTER_BLOCK',
        windowStart,
        expiresAt,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    this.logger.warn(`Registration identifier blocked: ${identifier}`);
    return record;
  }

  async assertSensitiveActionAllowed(params: {
    identifier: string;
    type: SensitiveActionType;
  }) {
    const now = new Date();
    const windowStart = bucket(now, this.sensitiveWindowMinutes);

    const record = await this.prisma.rateLimit.findUnique({
      where: {
        identifier_action_windowStart: {
          identifier: params.identifier,
          action: params.type,
          windowStart,
        },
      },
    });

    if ((record?.count ?? 0) >= this.sensitiveLimit) {
      throw new ForbiddenException('Too many requests');
    }

    await this.prisma.rateLimit.upsert({
      where: {
        identifier_action_windowStart: {
          identifier: params.identifier,
          action: params.type,
          windowStart,
        },
      },
      create: {
        identifier: params.identifier,
        action: params.type,
        windowStart,
        expiresAt: new Date(
          windowStart.getTime() +
          this.sensitiveWindowMinutes * 60 * 1000,
        ),
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });
  }
}
