import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenModule } from './token/token.module';
import { MailModule } from '../mail/mail.module';

import { AccountIdentityService } from './services/account-identity.service';
import { CredentialsPasswordsService } from './services/credentials-passwords.service';
import { SessionsDevicesService } from './services/sessions-devices.service';
import { TokensOrchestrationService } from './services/tokens-orchestration.service';
import { AuthorizationService } from './services/authorization.service';
import { SecurityAbuseService } from './services/security-abuse.service';
import { AuditObservabilityService } from './services/audit-observability.service';

import { GoogleAuthService } from './services/google-auth.service';
import { FacebookAuthService } from './services/facebook-auth.service';

@Module({
  imports: [
    TokenModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountIdentityService,
    CredentialsPasswordsService,
    SessionsDevicesService,
    TokensOrchestrationService,
    AuthorizationService,
    SecurityAbuseService,
    AuditObservabilityService,
    GoogleAuthService,
    FacebookAuthService,
  ],
  exports: [AuthService],
})
export class AuthModule { }
