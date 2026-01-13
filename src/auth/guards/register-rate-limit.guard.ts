import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { SecurityAbuseService } from '../services/security-abuse.service';

@Injectable()
export class RegisterRateLimitGuard implements CanActivate {
    constructor(private readonly security: SecurityAbuseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();

        await this.security.assertRegistrationAllowed({
            email: req.body?.email ?? 'unknown',
            ipAddress: req.ip ?? 'unknown',
        });

        return true;
    }
}
