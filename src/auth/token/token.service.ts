import {
    Injectable,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

interface DecodedAccessToken {
    sub: string;
    role: string;
    sessionId: string;
    jti: string;
    exp: number;
}

@Injectable()
export class TokenService {
    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    /* ------------------------------------------------------------------
     * ACCESS TOKEN
     * ------------------------------------------------------------------ */

    generateAccessToken(
        userId: string,
        role: string,
        sessionId: string,
    ): string {
        const jti = crypto.randomUUID();

        return this.jwt.sign(
            {
                sub: userId,
                role,
                sessionId,
                jti,
            },
            {
                issuer: 'auth-service',
                audience: 'api',
                expiresIn: this.config.getOrThrow('JWT_ACCESS_TTL'),
            },
        );
    }

    decodeAccessToken(token: string): DecodedAccessToken {
        return this.jwt.verify(token, {
            secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
            issuer: 'auth-service',
            audience: 'api',
        });
    }

    async blacklistAccessTokenFromJwt(
        rawAccessToken: string,
        reason: string,
    ): Promise<void> {
        const payload = this.decodeAccessToken(rawAccessToken);

        await this.prisma.tokenBlacklist.create({
            data: {
                tokenHash: this.hash(payload.jti),
                tokenType: 'ACCESS',
                userId: payload.sub,
                expiresAt: new Date(payload.exp * 1000),
                reason,
            },
        });
    }

    async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
        const record = await this.prisma.tokenBlacklist.findUnique({
            where: { tokenHash: this.hash(jti) },
        });

        return !!record && record.expiresAt > new Date();
    }

    /* ------------------------------------------------------------------
     * REFRESH TOKENS
     * ------------------------------------------------------------------ */

    async generateRefreshToken(params: {
        userId: string;
        sessionId: string;
        ipAddress: string;
        userAgent: string;
        tokenFamily?: string;
    }): Promise<{ refreshToken: string }> {
        const rawToken = crypto.randomBytes(64).toString('hex');

        await this.prisma.refreshToken.create({
            data: {
                userId: params.userId,
                sessionId: params.sessionId,
                tokenHash: this.hash(rawToken),
                tokenFamily: params.tokenFamily ?? crypto.randomUUID(),
                expiresAt: new Date(
                    Date.now() + this.parseTtl(
                        this.config.getOrThrow('JWT_REFRESH_TTL'),
                    ),
                ),
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });

        return { refreshToken: rawToken };
    }

    async rotateRefreshToken(params: {
        refreshToken: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<{
        userId: string;
        sessionId: string;
        refreshToken: string;
    }> {
        const tokenHash = this.hash(params.refreshToken);

        return this.prisma.$transaction(async (tx) => {
            const token = await tx.refreshToken.findUnique({
                where: { tokenHash },
                include: { session: true },
            });

            if (!token) {
                throw new ForbiddenException('Invalid refresh token');
            }

            if (!token.session.isActive || token.session.expiresAt <= new Date()) {
                await this.invalidateSession(token.sessionId, 'SESSION_EXPIRED');
                throw new ForbiddenException('Session expired');
            }

            const revoked = await tx.refreshToken.updateMany({
                where: {
                    id: token.id,
                    isRevoked: false,
                },
                data: {
                    isRevoked: true,
                    revokedAt: new Date(),
                },
            });

            if (revoked.count !== 1) {
                // reuse detected → revoke entire family
                await tx.refreshToken.updateMany({
                    where: { tokenFamily: token.tokenFamily },
                    data: {
                        isRevoked: true,
                        revokedAt: new Date(),
                    },
                });

                await this.invalidateSession(
                    token.sessionId,
                    'TOKEN_REUSE_DETECTED',
                );

                await tx.securityEvent.create({
                    data: {
                        userId: token.userId,
                        eventType: 'TOKEN_REUSE_DETECTED',
                        severity: 'CRITICAL',
                        description: 'Refresh token reuse detected',
                        ipAddress: params.ipAddress,
                        userAgent: params.userAgent,
                    },
                });

                throw new ForbiddenException('Refresh token reuse detected');
            }

            const { refreshToken } = await this.generateRefreshToken({
                userId: token.userId,
                sessionId: token.sessionId,
                tokenFamily: token.tokenFamily,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            });

            return {
                userId: token.userId,
                sessionId: token.sessionId,
                refreshToken,
            };
        });
    }

    /* ------------------------------------------------------------------
     * SESSION INVALIDATION
     * ------------------------------------------------------------------ */

    async invalidateSession(
        sessionId: string,
        reason: string,
    ): Promise<void> {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session || !session.isActive) return;

        await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                isActive: false,
                invalidatedAt: new Date(),
                invalidationReason: reason,
            },
        });

        await this.prisma.refreshToken.updateMany({
            where: { sessionId },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });
    }

    /* ------------------------------------------------------------------
     * MAINTENANCE
     * ------------------------------------------------------------------ */

    async cleanupExpiredAuthData(): Promise<void> {
        const now = new Date();

        await this.prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: now } },
        });

        await this.prisma.session.deleteMany({
            where: { expiresAt: { lt: now } },
        });

        await this.prisma.tokenBlacklist.deleteMany({
            where: { expiresAt: { lt: now } },
        });
    }

    /* ------------------------------------------------------------------
     * HELPERS
     * ------------------------------------------------------------------ */

    private hash(value: string): string {
        return crypto.createHash('sha256').update(value).digest('hex');
    }

    private parseTtl(ttl: string): number {
        const match = ttl.match(/^(\d+)([dhm])$/);
        if (!match) throw new Error(`Invalid TTL: ${ttl}`);

        const value = Number(match[1]);
        const unit = match[2];

        if (unit === 'd') return value * 86400000;
        if (unit === 'h') return value * 3600000;
        return value * 60000;
    }
}
