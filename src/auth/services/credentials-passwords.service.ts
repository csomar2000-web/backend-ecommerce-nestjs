import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionsDevicesService } from './sessions-devices.service';
import { MailService } from '../../mail/mail.service';
import { AuthProvider, MfaType, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const RESET_TOKEN_TTL_HOURS = 1;
const PASSWORD_MIN_LENGTH = 10;

@Injectable()
export class CredentialsPasswordsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly sessions: SessionsDevicesService,
        private readonly mail: MailService,
    ) { }

    /* ------------------------------------------------------------------ */
    /* LOGIN                                                              */
    /* ------------------------------------------------------------------ */

    async login(params: {
        email: string;
        password: string;
        ipAddress: string;
        userAgent: string;
    }) {
        const email = params.email.toLowerCase().trim();

        const account = await this.prisma.authAccount.findFirst({
            where: {
                provider: AuthProvider.LOCAL,
                user: { email },
            },
            include: { user: true },
        });

        if (!account || !account.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (account.verifiedAt === null) {
            throw new ForbiddenException('Email not verified');
        }

        const valid = await bcrypt.compare(
            params.password,
            account.passwordHash,
        );

        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Create session
        const session = await this.sessions.createSession({
            userId: account.user.id,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });

        // Check if MFA exists (simple enforcement)
        const mfaEnabled = await this.prisma.mfaFactor.findFirst({
            where: {
                userId: account.user.id,
                revokedAt: null,
                verifiedAt: { not: null },
            },
        });

        if (mfaEnabled) {
            return {
                mfaRequired: true,
                sessionId: session.id,
            };
        }

        await this.prisma.userAuditLog.create({
            data: {
                userId: account.user.id,
                action: 'LOGIN_SUCCESS',
                success: true,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });

        return { sessionId: session.id };
    }

    /* ------------------------------------------------------------------ */
    /* PASSWORD RESET                                                     */
    /* ------------------------------------------------------------------ */

    async requestPasswordReset(params: {
        email: string;
        ipAddress: string;
        userAgent: string;
    }) {
        const email = params.email.toLowerCase().trim();

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) return { success: true };

        const token = crypto.randomBytes(48).toString('hex');

        await this.prisma.passwordReset.create({
            data: {
                userId: user.id,
                token,
                expiresAt: new Date(
                    Date.now() + RESET_TOKEN_TTL_HOURS * 3600000,
                ),
            },
        });

        await this.mail.sendPasswordReset(
            user.email,
            `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
        );

        return { success: true };
    }

    async confirmPasswordReset(params: {
        token: string;
        newPassword: string;
        ipAddress: string;
        userAgent: string;
    }) {
        if (params.newPassword.length < PASSWORD_MIN_LENGTH) {
            throw new BadRequestException('Password too weak');
        }

        const reset = await this.prisma.passwordReset.findFirst({
            where: {
                token: params.token,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
        });

        if (!reset) {
            throw new BadRequestException('Invalid or expired token');
        }

        const passwordHash = await bcrypt.hash(params.newPassword, 12);

        await this.prisma.$transaction([
            this.prisma.authAccount.updateMany({
                where: {
                    userId: reset.userId,
                    provider: AuthProvider.LOCAL,
                },
                data: { passwordHash },
            }),
            this.prisma.passwordReset.update({
                where: { id: reset.id },
                data: { usedAt: new Date() },
            }),
            this.prisma.session.updateMany({
                where: { userId: reset.userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);

        await this.prisma.userAuditLog.create({
            data: {
                userId: reset.userId,
                action: 'PASSWORD_RESET',
                success: true,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });

        return { success: true };
    }

    /* ------------------------------------------------------------------ */
    /* PASSWORD CHANGE                                                    */
    /* ------------------------------------------------------------------ */

    async changePassword(params: {
        userId: string;
        currentPassword: string;
        newPassword: string;
        ipAddress: string;
        userAgent: string;
    }) {
        if (params.newPassword.length < PASSWORD_MIN_LENGTH) {
            throw new BadRequestException('Password too weak');
        }

        const account = await this.prisma.authAccount.findFirst({
            where: {
                userId: params.userId,
                provider: AuthProvider.LOCAL,
            },
        });

        if (!account || !account.passwordHash) {
            throw new ForbiddenException();
        }

        const valid = await bcrypt.compare(
            params.currentPassword,
            account.passwordHash,
        );

        if (!valid) {
            throw new UnauthorizedException('Invalid password');
        }

        const newHash = await bcrypt.hash(params.newPassword, 12);

        await this.prisma.$transaction([
            this.prisma.authAccount.update({
                where: { id: account.id },
                data: { passwordHash: newHash },
            }),
            this.prisma.session.updateMany({
                where: { userId: params.userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);

        await this.prisma.userAuditLog.create({
            data: {
                userId: params.userId,
                action: 'PASSWORD_CHANGED',
                success: true,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });

        return { success: true };
    }
}
