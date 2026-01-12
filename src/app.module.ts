import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import * as Joi from 'joi';
import * as crypto from 'crypto';

import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { MessagesModule } from './message/messages.module';
import { MetricsModule } from './metrics/metrics.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HttpErrorShapeFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level:
          process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        genReqId: (req) =>
          req.headers['x-request-id'] ?? crypto.randomUUID(),
        serializers: {
          req(req) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
            };
          },
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().uri().required(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_TTL: Joi.string().required(),
        JWT_REFRESH_TTL: Joi.string().required(),
        CORS_ORIGIN: Joi.string().required(),
        SMTP_HOST: Joi.string().optional(),
        SMTP_USER: Joi.string().optional(),
        SMTP_PASS: Joi.string().optional(),
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60,
          limit: 20,
        },
      ],
    }),
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
      useClass: ThrottlerGuard,
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
