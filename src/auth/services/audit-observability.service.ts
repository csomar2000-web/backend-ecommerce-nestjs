import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditObservabilityService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async audit(params: {
        userId: string;
        eventType: string;
        eventAction: string;
        success: boolean;
        ipAddress: string;
        userAgent: string;
        sessionId?: string;
        resourceType?: string;
        resourceId?: string;
        metadata?: Record<string, unknown>;
        failureReason?: string;
    }) {
        await this.prisma.userAuditLog.create({
            data: {
                userId: params.userId,
                eventType: params.eventType as any,
                eventAction: params.eventAction,
                success: params.success,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                sessionId: params.sessionId,
                resourceType: params.resourceType,
                resourceId: params.resourceId,
                metadata: params.metadata,
                failureReason: params.failureReason,
            },
        });
    }

    async securityEvent(params: {
        userId?: string;
        email?: string;
        eventType: string;
        severity: string;
        description: string;
        ipAddress: string;
        userAgent: string;
        blocked?: boolean;
        actionTaken?: string;
        metadata?: Record<string, unknown>;
    }) {
        await this.prisma.securityEvent.create({
            data: {
                userId: params.userId,
                email: params.email,
                eventType: params.eventType as any,
                severity: params.severity as any,
                description: params.description,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                blocked: params.blocked ?? false,
                actionTaken: params.actionTaken,
                metadata: params.metadata,
            },
        });
    }

    async auditAuthSuccess(params: {
        userId: string;
        action: string;
        sessionId?: string;
        ipAddress: string;
        userAgent: string;
    }) {
        await this.audit({
            userId: params.userId,
            eventType: 'AUTH',
            eventAction: params.action,
            success: true,
            sessionId: params.sessionId,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
    }

    async auditAuthFailure(params: {
        userId: string;
        action: string;
        reason: string;
        ipAddress: string;
        userAgent: string;
    }) {
        await this.audit({
            userId: params.userId,
            eventType: 'AUTH',
            eventAction: params.action,
            success: false,
            failureReason: params.reason,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
    }
}
