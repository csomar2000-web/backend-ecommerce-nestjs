import {
    CanActivate,
    ExecutionContext,
    Injectable,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { SecurityAbuseService } from '../services/security-abuse.service';
import type { Response } from 'express';

@Injectable()
export class RegisterRateLimitGuard implements CanActivate {
    constructor(private readonly security: SecurityAbuseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse<Response>();

        try {
            await this.security.assertRegistrationAllowed({
                email: req.body?.email ?? 'unknown',
                ipAddress: req.ip ?? 'unknown',
            });
        } catch (error) {
            if (
                error instanceof HttpException &&
                error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
            ) {
                const response = error.getResponse();
                const retryAfterSeconds =
                    typeof response === 'object' && response !== null
                        ? (response as { retryAfterSeconds?: number }).retryAfterSeconds
                        : undefined;

                if (retryAfterSeconds) {
                    res.setHeader('Retry-After', String(retryAfterSeconds));
                }
            }

            throw error;
        }

        return true;
    }
}
