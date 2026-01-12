import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import * as crypto from 'crypto';

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
    ],
})
export class LoggingModule { }
