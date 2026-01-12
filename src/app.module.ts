import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import * as Joi from 'joi';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { MessagesModule } from './message/messages.module';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HttpErrorShapeFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_TTL: Joi.string().required(),
        JWT_REFRESH_TTL: Joi.string().required(),
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
