import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { AccountIdentityService } from './services/account-identity.service';
import { CredentialsPasswordsService } from './services/credentials-passwords.service';
import { SessionsDevicesService } from './services/sessions-devices.service';
import { TokensOrchestrationService } from './services/tokens-orchestration.service';
import { AuthorizationService } from './services/authorization.service';
import { SecurityAbuseService } from './services/security-abuse.service';
import { AuditObservabilityService } from './services/audit-observability.service';

import { GoogleAuthService } from './services/google-auth.service';
import { FacebookAuthService } from './services/facebook-auth.service';

import { AuthProvider } from '@prisma/client';
import { SocialProfile } from './types/social-profile.type';

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
    private readonly googleAuth: GoogleAuthService,
    private readonly facebookAuth: FacebookAuthService,
  ) {}

  /* --------------------------------------------------------------------------
   * Registration & email verification
   * -------------------------------------------------------------------------- */

  register(dto: any) {
    return this.accountIdentity.register(dto);
  }

  verifyEmail(token: string) {
    return this.accountIdentity.verifyEmail(token);
  }

  resendVerification(email: string) {
    this.security.assertSensitiveActionAllowed({
      action: 'EMAIL_VERIFICATION',
      identifier: email,
    });

    return this.accountIdentity.resendVerification(email);
  }

  /* --------------------------------------------------------------------------
   * Local authentication
   * -------------------------------------------------------------------------- */

  async login(dto: any) {
    await this.security.assertLoginAllowed({
      identifier: dto.email,
      ipAddress: dto.ipAddress,
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

  logout(dto: { userId: string; sessionId: string; accessToken: string }) {
    return this.sessions.logoutCurrentSession(dto);
  }

  logoutAll(dto: { userId: string; accessToken: string }) {
    return this.sessions.logoutAllSessions(dto);
  }

  /* --------------------------------------------------------------------------
   * Password management
   * -------------------------------------------------------------------------- */

  requestPasswordReset(dto: any) {
    return this.credentials.requestPasswordReset(dto);
  }

  confirmPasswordReset(dto: any) {
    return this.credentials.confirmPasswordReset(dto);
  }

  changePassword(dto: any) {
    return this.credentials.changePassword(dto);
  }

  /* --------------------------------------------------------------------------
   * Sessions
   * -------------------------------------------------------------------------- */

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

  /* --------------------------------------------------------------------------
   * Social authentication
   * -------------------------------------------------------------------------- */

  async loginWithGoogle(idToken: string, req: Request) {
    await this.security.assertLoginAllowed({
      identifier: 'google',
      ipAddress: req.ip,
    });

    const profile = await this.googleAuth.verifyIdToken(idToken);

    return this.handleSocialLogin(AuthProvider.GOOGLE, profile, req);
  }

  async loginWithFacebook(accessToken: string, req: Request) {
    await this.security.assertLoginAllowed({
      identifier: 'facebook',
      ipAddress: req.ip,
    });

    const profile = await this.facebookAuth.verifyAccessToken(accessToken);

    return this.handleSocialLogin(AuthProvider.FACEBOOK, profile, req);
  }

  /* --------------------------------------------------------------------------
   * Core social login orchestration
   * -------------------------------------------------------------------------- */

  private async handleSocialLogin(
    provider: AuthProvider,
    profile: SocialProfile,
    req: Request,
  ) {
    // Enforce email policy (recommended for production)
    if (!profile.email) {
      throw new UnauthorizedException('Social account has no email');
    }

    if (!profile.emailVerified) {
      throw new UnauthorizedException('Email is not verified');
    }

    const { user, authAccount } =
      await this.accountIdentity.upsertSocialAccount({
        provider,
        providerId: profile.providerId,
        email: profile.email,
        emailVerified: profile.emailVerified,
        name: profile.name,
        avatarUrl: profile.avatar,
      });

    // Create session BEFORE MFA enforcement
    const session = await this.sessions.createSession({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Audit log
    await this.audit.log({
      action: 'AUTH_SOCIAL_LOGIN',
      userId: user.id,
      metadata: {
        provider,
        authAccountId: authAccount.id,
      },
    });

    // Single source of truth for MFA + token issuance
    return this.tokens.issueTokens({
      user,
      session,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
