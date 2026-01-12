import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
    imports: [
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

                THROTTLE_TTL: Joi.number().default(60),
                THROTTLE_LIMIT: Joi.number().default(100),

                SMTP_HOST: Joi.string().optional(),
                SMTP_USER: Joi.string().optional(),
                SMTP_PASS: Joi.string().optional(),
            }),
        }),
    ],
})
export class AppConfigModule { }
