import { Injectable } from '@nestjs/common';
import { Prisma, UserAuditLog } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditObservabilityService {
    constructor(private readonly prisma: PrismaService) { }

    async audit(params: {
        userId: string;
        action: string;
        success: boolean;
        ipAddress?: string;
        userAgent?: string;
        resource?: string;
        resourceId?: string;
        metadata?: Record<string, unknown>;
        errorMessage?: string;
    }): Promise<UserAuditLog> {
        return this.prisma.userAuditLog.create({
            data: {
                userId: params.userId,
                action: params.action,
                success: params.success,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                resource: params.resource,
                resourceId: params.resourceId,
                errorMessage: params.errorMessage,
                metadata: params.metadata as Prisma.InputJsonValue | undefined,
            },
        });
    }

    /* ----------------------------------------------------
     * AUTH HELPERS
     * ---------------------------------------------------- */

    async auditAuthSuccess(params: {
        userId: string;
        action: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        return this.audit({
            userId: params.userId,
            action: `AUTH_${params.action}`,
            success: true,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
    }

    async auditAuthFailure(params: {
        userId: string;
        action: string;
        reason: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        return this.audit({
            userId: params.userId,
            action: `AUTH_${params.action}`,
            success: false,
            errorMessage: params.reason,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
    }
}
