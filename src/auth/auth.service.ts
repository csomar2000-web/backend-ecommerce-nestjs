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
  ) { }

  register(dto: any) {
    return this.accountIdentity.register(dto);
  }

  verifyEmail(token: string) {
    return this.accountIdentity.verifyEmail(token);
  }

  resendVerification(email: string) {
    return this.accountIdentity.resendVerification(email);
  }

  async login(dto: any) {
    await this.security.assertLoginAllowed({
      identifier: dto.email,
    });

    try {
      const result = await this.credentials.login(dto);
      await this.security.clearLoginFailures(dto.email);
      return result;
    } catch (error) {
      await this.security.recordFailedLogin({
        identifier: dto.email,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      });
      throw error;
    }
  }

  refresh(dto: any) {
    return this.tokens.refreshTokens(dto);
  }

  logout(dto: {
    userId: string;
    sessionId: string;
    accessToken: string;
  }) {
    return this.sessions.logoutCurrentSession(dto);
  }

  logoutAll(dto: { userId: string; accessToken: string }) {
    return this.sessions.logoutAllSessions(dto);
  }

  requestPasswordReset(dto: any) {
    return this.credentials.requestPasswordReset(dto);
  }

  confirmPasswordReset(dto: any) {
    return this.credentials.confirmPasswordReset(dto);
  }

  changePassword(dto: any) {
    return this.credentials.changePassword(dto);
  }

  listSessions(userId: string) {
    return this.sessions.listSessions(userId);
  }

  revokeSession(dto: {
    userId: string;
    sessionId: string;
    accessToken: string;
  }) {
    return this.sessions.revokeSession(dto);
  }
}
