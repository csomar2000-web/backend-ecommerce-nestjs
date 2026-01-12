import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { AppConfigModule } from './config/app-config.module';
import { LoggingModule } from './config/logging.module';
import { RateLimitModule } from './config/rate-limit.module';

import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { MessagesModule } from './message/messages.module';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HttpErrorShapeFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    RateLimitModule,
    HealthModule,
    MetricsModule,
    PrismaModule,
    AuthModule,
    NewsletterModule,
    MessagesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpErrorShapeFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
