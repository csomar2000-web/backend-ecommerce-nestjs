import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;
const RESET_TOKEN_TTL_HOURS = 1;

@Injectable()
export class CredentialsPasswordsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tokenService: TokenService,
    ) { }

    async login(params: {
        email: string;
        password: string;
        ipAddress: string;
        userAgent: string;
    }) {
        const { email, password, ipAddress, userAgent } = params;

        const recentFailures = await this.prisma.securityEvent.count({
            where: {
                email,
                eventType: 'FAILED_LOGIN',
                createdAt: {
                    gte: new Date(
                        Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000,
                    ),
                },
            },
        });

        if (recentFailures >= MAX_FAILED_ATTEMPTS) {
            throw new ForbiddenException('Account temporarily locked');
        }

        const account = await this.prisma.authAccount.findFirst({
            where: {
                provider: 'LOCAL',
                user: { email },
            },
            include: { user: true },
        });

        if (!account || !account.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!account.isVerified) {
            throw new ForbiddenException('Email not verified');
        }

        const passwordValid = await bcrypt.compare(
            password,
            account.passwordHash,
        );

        if (!passwordValid) {
            await this.prisma.securityEvent.create({
                data: {
                    email,
                    eventType: 'FAILED_LOGIN',
                    severity: 'MEDIUM',
                    description: 'Invalid password',
                    ipAddress,
                    userAgent,
                },
            });
            throw new UnauthorizedException('Invalid credentials');
        }

        const session = await this.prisma.session.create({
            data: {
                userId: account.user.id,
                ipAddress,
                userAgent,
                expiresAt: new Date(
                    Date.now() + 1000 * 60 * 60 * 24 * 30,
                ),
            },
        });

        const accessToken =
            this.tokenService.generateAccessToken(
                account.user.id,
                account.user.roleAssignments?.[0]?.roleId ?? 'CUSTOMER',
                session.id,
            );

        const { refreshToken } =
            await this.tokenService.generateRefreshToken({
                userId: account.user.id,
                sessionId: session.id,
                ipAddress,
                userAgent,
            });

        await this.prisma.userAuditLog.create({
            data: {
                userId: account.user.id,
                eventType: 'AUTH',
                eventAction: 'LOGIN',
                ipAddress,
                userAgent,
                success: true,
            },
        });

        return { accessToken, refreshToken };
    }

    async requestPasswordReset(params: {
        email: string;
        ipAddress: string;
        userAgent: string;
    }) {
        const user = await this.prisma.user.findUnique({
            where: { email: params.email },
        });

        if (!user) {
            return { success: true };
        }

        const rawToken = crypto.randomBytes(48).toString('hex');
        const tokenHash = this.hashToken(rawToken);

        await this.prisma.passwordReset.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: new Date(
                    Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000,
                ),
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });

        return { resetToken: rawToken };
    }

    async confirmPasswordReset(params: {
        token: string;
        newPassword: string;
        confirmPassword: string;
    }) {
        if (params.newPassword !== params.confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        this.assertStrongPassword(params.newPassword);

        const tokenHash = this.hashToken(params.token);

        const record = await this.prisma.passwordReset.findUnique({
            where: { tokenHash },
        });

        if (
            !record ||
            record.used ||
            record.expiresAt < new Date()
        ) {
            throw new UnauthorizedException('Invalid reset token');
        }

        const passwordHash = await bcrypt.hash(params.newPassword, 12);

        await this.prisma.$transaction([
            this.prisma.authAccount.updateMany({
                where: {
                    userId: record.userId,
                    provider: 'LOCAL',
                },
                data: {
                    passwordHash,
                },
            }),
            this.prisma.passwordReset.update({
                where: { id: record.id },
                data: {
                    used: true,
                    usedAt: new Date(),
                },
            }),
        ]);

        return { success: true };
    }

    async changePassword(params: {
        userId: string;
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }) {
        if (params.newPassword !== params.confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        this.assertStrongPassword(params.newPassword);

        const account = await this.prisma.authAccount.findFirst({
            where: {
                userId: params.userId,
                provider: 'LOCAL',
            },
        });

        if (!account || !account.passwordHash) {
            throw new UnauthorizedException();
        }

        const valid = await bcrypt.compare(
            params.currentPassword,
            account.passwordHash,
        );

        if (!valid) {
            throw new UnauthorizedException('Invalid password');
        }

        const passwordHash = await bcrypt.hash(params.newPassword, 12);

        await this.prisma.authAccount.update({
            where: { id: account.id },
            data: { passwordHash },
        });

        return { success: true };
    }

    private assertStrongPassword(password: string) {
        if (
            !/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}/.test(
                password,
            )
        ) {
            throw new BadRequestException('Weak password');
        }
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}
