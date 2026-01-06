import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { MailService } from '../../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AccountIdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) { }

  async register(params: {
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const { email, password, confirmPassword, phoneNumber, ipAddress, userAgent } = params;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}/.test(password)) {
      throw new BadRequestException('Weak password');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        authAccounts: {
          create: {
            provider: 'LOCAL',
            passwordHash,
            isPrimary: true,
            isVerified: false,
          },
        },
        customerProfile: {
          create: {
            phoneNumber,
          },
        },
      },
    });

    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const link = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

    await this.mailService.sendEmailVerification(email, link);

    await this.prisma.userAuditLog.create({
      data: {
        userId: user.id,
        eventType: 'AUTH',
        eventAction: 'REGISTER',
        ipAddress,
        userAgent,
        success: true,
      },
    });

    return { success: true };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);

    const record = await this.prisma.emailVerification.findUnique({
      where: { tokenHash },
    });

    if (!record || record.expiresAt < new Date() || record.verified) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      }),
      this.prisma.authAccount.updateMany({
        where: {
          userId: record.userId,
          provider: 'LOCAL',
        },
        data: {
          isVerified: true,
        },
      }),
    ]);

    return { success: true };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { authAccounts: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const localAccount = user.authAccounts.find(a => a.provider === 'LOCAL');

    if (!localAccount || localAccount.isVerified) {
      throw new BadRequestException('Account already verified');
    }

    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.emailVerification.updateMany({
      where: {
        userId: user.id,
        verified: false,
      },
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        attempts: { increment: 1 },
      },
    });

    const link = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

    await this.mailService.sendEmailVerification(email, link);

    return { success: true };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
