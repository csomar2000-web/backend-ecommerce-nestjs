import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpErrorShapeFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpErrorShapeFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_SERVER_ERROR';
        let message: string | string[] = 'Unexpected error';

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            const mapped = this.mapPrismaError(exception);
            status = mapped.status;
            code = mapped.code;
            message = mapped.message;
        } else if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse() as any;

            if (typeof res === 'string') {
                message = res;
            } else if (res?.message) {
                message = Array.isArray(res.message) ? res.message : res.message;
            }

            code = this.mapHttpStatusToCode(status);
        } else {
            this.logger.error(
                `${request.method} ${request.originalUrl}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
        }

        response.status(status).json({
            error: {
                code,
                message,
            },
        });
    }

    private mapHttpStatusToCode(status: number): string {
        switch (status) {
            case HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';
            case HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';
            case HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';
            case HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case HttpStatus.CONFLICT:
                return 'CONFLICT';
            case HttpStatus.TOO_MANY_REQUESTS:
                return 'RATE_LIMITED';
            default:
                return 'INTERNAL_SERVER_ERROR';
        }
    }

    private mapPrismaError(error: Prisma.PrismaClientKnownRequestError): {
        status: number;
        code: string;
        message: string;
    } {
        switch (error.code) {
            case 'P2002':
                return {
                    status: HttpStatus.CONFLICT,
                    code: 'CONFLICT',
                    message: 'Resource already exists',
                };

            case 'P2025':
                return {
                    status: HttpStatus.NOT_FOUND,
                    code: 'NOT_FOUND',
                    message: 'Resource not found',
                };

            case 'P2003':
                return {
                    status: HttpStatus.BAD_REQUEST,
                    code: 'INVALID_REFERENCE',
                    message: 'Invalid relation reference',
                };

            default:
                return {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    code: 'DATABASE_ERROR',
                    message: 'Database operation failed',
                };
        }
    }
}
