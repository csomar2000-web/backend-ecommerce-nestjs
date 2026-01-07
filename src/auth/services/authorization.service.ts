import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthorizationService {
    constructor(private readonly prisma: PrismaService) { }

    /* ----------------------------------------------------
     * ROLE RESOLUTION
     * ---------------------------------------------------- */

    async getActiveRole(params: {
        userId: string;
        companyId?: string;
    }) {
        const assignment = await this.prisma.userRoleAssignment.findFirst({
            where: {
                userId: params.userId,
                companyId: params.companyId ?? null,
                revokedAt: null,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            include: {
                role: true,
            },
        });

        if (!assignment || !assignment.role.isActive) {
            throw new ForbiddenException('No active role assigned');
        }

        return assignment.role;
    }

    /* ----------------------------------------------------
     * PERMISSIONS
     * ---------------------------------------------------- */

    async getEffectivePermissions(params: {
        userId: string;
        companyId?: string;
    }): Promise<string[]> {
        const role = await this.getActiveRole(params);

        const rolePermissions = await this.prisma.rolePermission.findMany({
            where: {
                roleId: role.id,
            },
            include: {
                permission: true,
            },
        });

        return rolePermissions.map((rp) =>
            this.key(rp.permission),
        );
    }

    /* ----------------------------------------------------
     * ASSERTION
     * ---------------------------------------------------- */

    async assertPermission(params: {
        userId: string;
        resource: string;
        action: string;
        companyId?: string;
    }) {
        const effective = await this.getEffectivePermissions({
            userId: params.userId,
            companyId: params.companyId,
        });

        const key = `${params.resource}:${params.action}`;

        if (!effective.includes(key)) {
            throw new ForbiddenException(
                `Permission denied: ${key}`,
            );
        }

        return true;
    }

    /* ----------------------------------------------------
     * HELPERS
     * ---------------------------------------------------- */

    private key(permission: {
        resource: string;
        action: string;
    }) {
        return `${permission.resource}:${permission.action}`;
    }
}
