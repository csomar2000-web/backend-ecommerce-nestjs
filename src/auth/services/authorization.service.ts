import {
    Injectable,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthorizationService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async getActiveRole(params: {
        userId: string;
        companyId?: string;
    }) {
        const assignment =
            await this.prisma.userRoleAssignment.findFirst({
                where: {
                    userId: params.userId,
                    isActive: true,
                    expiresAt: {
                        OR: [{ gt: new Date() }, { equals: null }],
                    },
                    companyId: params.companyId ?? null,
                },
                include: {
                    role: true,
                },
            });

        if (!assignment || !assignment.role.isActive) {
            throw new ForbiddenException();
        }

        return assignment.role;
    }

    async getEffectivePermissions(params: {
        userId: string;
        companyId?: string;
    }) {
        const role = await this.getActiveRole(params);

        const rolePermissions =
            await this.prisma.rolePermission.findMany({
                where: {
                    roleId: role.id,
                },
                include: {
                    permission: true,
                },
            });

        const overrides =
            await this.prisma.userPermissionOverride.findMany({
                where: {
                    userId: params.userId,
                    companyId: params.companyId ?? null,
                    expiresAt: {
                        OR: [{ gt: new Date() }, { equals: null }],
                    },
                },
                include: {
                    permission: true,
                },
            });

        const permissions = new Map<string, boolean>();

        for (const rp of rolePermissions) {
            const key = this.key(rp.permission);
            permissions.set(key, true);
        }

        for (const override of overrides) {
            const key = this.key(override.permission);
            permissions.set(key, override.isGranted);
        }

        return Array.from(permissions.entries())
            .filter(([, granted]) => granted)
            .map(([key]) => key);
    }

    async assertPermission(params: {
        userId: string;
        resource: string;
        action: string;
        scope?: string;
        companyId?: string;
    }) {
        const effective =
            await this.getEffectivePermissions({
                userId: params.userId,
                companyId: params.companyId,
            });

        const key = `${params.resource}:${params.action}:${params.scope ?? '*'}`;

        if (!effective.includes(key)) {
            throw new ForbiddenException();
        }

        return true;
    }

    private key(permission: {
        resource: string;
        action: string;
        scope?: string | null;
    }) {
        return `${permission.resource}:${permission.action}:${permission.scope ?? '*'}`;
    }
}
