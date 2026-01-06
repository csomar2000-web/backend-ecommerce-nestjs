import { Injectable } from '@nestjs/common';
import { AccountIdentityService } from './services/account-identity.service';
import { CredentialsPasswordsService } from './services/credentials-passwords.service';
import { SessionsDevicesService } from './services/sessions-devices.service';
import { TokensOrchestrationService } from './services/tokens-orchestration.service';
import { AuthorizationService } from './services/authorization.service';
import { SecurityAbuseService } from './services/security-abuse.service';
import { AuditObservabilityService } from './services/audit-observability.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountIdentity: AccountIdentityService,
    private readonly credentials: CredentialsPasswordsService,
    private readonly sessions: SessionsDevicesService,
    private readonly tokens: TokensOrchestrationService,
    private readonly authorization: AuthorizationService,
    private readonly security: SecurityAbuseService,
    private readonly audit: AuditObservabilityService,
  ) {}

  register(dto) {
    return this.accountIdentity.register(dto);
  }

  verifyEmail(token: string) {
    return this.accountIdentity.verifyEmail(token);
  }

  resendVerification(email: string) {
    return this.accountIdentity.resendVerification(email);
  }

  async login(dto) {
    await this.security.assertLoginAllowed({
      identifier: dto.email,
    });

    try {
      const result = await this.credentials.login(dto);
      await this.security.clearLoginFailures(dto.email);
      return result;
    } catch (e) {
      await this.security.recordFailedLogin({
        identifier: dto.email,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      });
      throw e;
    }
  }

  refresh(dto) {
    return this.tokens.refreshTokens(dto);
  }

  logout(dto) {
    return this.sessions.logoutCurrentSession(dto);
  }

  logoutAll(dto) {
    return this.sessions.logoutAllSessions(dto.userId);
  }

  requestPasswordReset(dto) {
    return this.credentials.requestPasswordReset(dto);
  }

  confirmPasswordReset(dto) {
    return this.credentials.confirmPasswordReset(dto);
  }

  changePassword(dto) {
    return this.credentials.changePassword(dto);
  }

  listSessions(userId: string) {
    return this.sessions.listSessions(userId);
  }

  revokeSession(dto) {
    return this.sessions.revokeSession(dto);
  }
}
