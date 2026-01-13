import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { AuthProvider, MfaType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';


const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const MASTER_KEY = Buffer.from(process.env.MFA_SECRET_KEY!, 'hex');

function assertStrongPassword(password: string) {
  if (!PASSWORD_REGEX.test(password)) {
    throw new BadRequestException('Weak password');
  }
}

function encryptValue(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);

  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

function decryptValue(data: {
  encrypted: string;
  iv: string;
  tag: string;
}) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    MASTER_KEY,
    Buffer.from(data.iv, 'base64'),
  );

  decipher.setAuthTag(Buffer.from(data.tag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data.encrypted, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}


@Injectable()
export class AccountIdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) { }


  async register(params: {
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const { email, password, confirmPassword, phone } = params;
    const normalizedEmail = email.toLowerCase().trim();

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    assertStrongPassword(password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const encryptedPhone = phone ? encryptValue(phone) : null;

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        authAccounts: {
          create: {
            provider: AuthProvider.LOCAL,
            providerId: normalizedEmail,
            passwordHash,
            isPrimary: true,
          },
        },
        customerProfile: encryptedPhone
          ? {
            create: {
              phoneEncrypted: encryptedPhone.encrypted,
              phoneIv: encryptedPhone.iv,
              phoneTag: encryptedPhone.tag,
            },
          }
          : undefined,
      },
    });

    const rawToken = crypto.randomBytes(48).toString('hex');
    const hashedToken = this.hash(rawToken);

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.mailService.sendEmailVerification(
      normalizedEmail,
      `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`,
    );

    return { success: true };
  }


  async verifyEmail(token: string) {
    const hashedToken = this.hash(token);

    const record = await this.prisma.emailVerification.findUnique({
      where: { token: hashedToken },
    });

    if (!record || record.expiresAt < new Date() || record.verifiedAt) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { verifiedAt: new Date() },
      }),
      this.prisma.authAccount.updateMany({
        where: {
          userId: record.userId,
          provider: AuthProvider.LOCAL,
        },
        data: { verifiedAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { authAccounts: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const localAccount = user.authAccounts.find(
      (a) => a.provider === AuthProvider.LOCAL,
    );

    if (!localAccount || localAccount.verifiedAt) {
      throw new BadRequestException('Account already verified');
    }

    const rawToken = crypto.randomBytes(48).toString('hex');

    await this.prisma.emailVerification.updateMany({
      where: { userId: user.id, verifiedAt: null },
      data: {
        token: this.hash(rawToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.mailService.sendEmailVerification(
      normalizedEmail,
      `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`,
    );

    return { success: true };
  }

  async upsertSocialAccount(params: {
    provider: AuthProvider;
    providerId: string;
    email: string;
    emailVerified: boolean;
  }) {
    const normalizedEmail = params.email.toLowerCase().trim();

    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: { email: normalizedEmail },
        });
      }

      const authAccount = await tx.authAccount.upsert({
        where: {
          provider_providerId: {
            provider: params.provider,
            providerId: params.providerId,
          },
        },
        update: {
          lastUsedAt: new Date(),
          verifiedAt: params.emailVerified ? new Date() : null,
        },
        create: {
          userId: user.id,
          provider: params.provider,
          providerId: params.providerId,
          isPrimary: false,
          verifiedAt: params.emailVerified ? new Date() : null,
        },
      });

      return { user, authAccount };
    });
  }

  async setupMfaTotp(userId: string) {
    const secret = speakeasy.generateSecret({ length: 20 });
    const encrypted = encryptValue(secret.base32);

    await this.prisma.mfaFactor.upsert({
      where: {
        userId_type: { userId, type: MfaType.TOTP },
      },
      update: {
        secretCipher: encrypted.encrypted,
        secretIv: encrypted.iv,
        secretTag: encrypted.tag,
        revokedAt: null,
      },
      create: {
        userId,
        type: MfaType.TOTP,
        secretCipher: encrypted.encrypted,
        secretIv: encrypted.iv,
        secretTag: encrypted.tag,
      },
    });

    return {
      otpauthUrl: secret.otpauth_url,
      base32: secret.base32,
    };
  }

  async confirmMfaTotp(params: { userId: string; code: string }) {
    const factor = await this.prisma.mfaFactor.findFirst({
      where: {
        userId: params.userId,
        type: MfaType.TOTP,
        revokedAt: null,
      },
    });

    if (!factor) {
      throw new BadRequestException('MFA not initialized');
    }

    const secret = decryptValue({
      encrypted: factor.secretCipher,
      iv: factor.secretIv,
      tag: factor.secretTag,
    });

    const valid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: params.code,
      window: 1,
    });

    if (!valid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.mfaFactor.update({
      where: { id: factor.id },
      data: {
        verifiedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    return { success: true };
  }


  private hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}
