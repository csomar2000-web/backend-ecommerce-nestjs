import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { SessionsDevicesService } from './sessions-devices.service';
import { SecurityAbuseService } from './security-abuse.service';
import { MailService } from '../../mail/mail.service';
import { AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const RESET_TOKEN_TTL_HOURS = 1;

@Injectable()
export class CredentialsPasswordsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tokenService: TokenService,
        private readonly sessions: SessionsDevicesService,
        private readonly abuse: SecurityAbuseService,
        private readonly mail: MailService,
    ) { }

    async login(params: {
        email: string;
        password: string;
        ipAddress: string;
        userAgent: string;
        deviceId?: string;
        deviceName?: string;
    }) {
        const { email, password, ipAddress, userAgent } = params;

        await this.abuse.assertLoginAllowed({ identifier: email });

        const account = await this.prisma.authAccount.findFirst({
            where: {
                provider: AuthProvider.LOCAL,
                user: { email },
            },
            include: {
                user: true,
            },
        });

        if (!account || !account.passwordHash) {
            await this.abuse.recordFailedLogin({
                identifier: email,
                ipAddress,
                userAgent,
            });
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!account.isVerified) {
            throw new ForbiddenException('Email not verified');
        }

        const valid = await bcrypt.compare(password, account.passwordHash);

        if (!valid) {
            await this.abuse.recordFailedLogin({
                identifier: email,
                ipAddress,
                userAgent,
            });
            throw new UnauthorizedException('Invalid credentials');
        }

        await this.abuse.clearLoginFailures(email);

        const session = await this.sessions.createSession({
            userId: account.user.id,
            ipAddress,
            userAgent,
            deviceId: params.deviceId,
            deviceName: params.deviceName,
        });

        const accessToken = this.tokenService.generateAccessToken(
            account.user.id,
            'CUSTOMER',
            session.id,
        );

        const { refreshToken } = await this.tokenService.generateRefreshToken({
            userId: account.user.id,
            sessionId: session.id,
            ipAddress,
            userAgent,
        });

        await this.mail.sendSecurityAlert(account.user.email, {
            type: 'NEW_DEVICE_LOGIN',
            ipAddress,
            userAgent,
        });

        return { accessToken, refreshToken };
    }

    async requestPasswordReset(params: {
        email: string;
        ipAddress: string;
        userAgent: string;
    }) {
        await this.abuse.assertSensitiveActionAllowed({
            identifier: params.email,
            type: 'PASSWORD_RESET',
        });

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

        await this.mail.sendPasswordReset(
            user.email,
            `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`,
        );

        return { success: true };
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}
