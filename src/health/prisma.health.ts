import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
    constructor(private prisma: PrismaService) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;

            return {
                [key]: {
                    status: 'up',
                },
            };
        } catch {
            return {
                [key]: {
                    status: 'down',
                },
            };
        }
    }
}
