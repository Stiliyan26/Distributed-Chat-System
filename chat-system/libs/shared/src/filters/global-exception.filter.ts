import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { EntityNotFoundError, QueryFailedError, TypeORMError } from "typeorm";

interface DatabaseErrorResponse {
    status: number;
    message: string;
    error: string;
}

interface ResolvedException {
    status: number,
    message: string | string[],
    error: string
}

interface PostgresError extends Error {
    code: string;
    detail?: string;
    table?: string;
    constraint?: string;
}

const DATABASE_ERROR_MAP: Record<string, DatabaseErrorResponse> = {
    '23505': {
        status: HttpStatus.CONFLICT,
        message: 'A record with that value already existts',
        error: 'Conflict',
    },
    '23503': {
        status: HttpStatus.BAD_REQUEST,
        message: 'Referenced resources does not exist',
        error: 'Bad Request'
    },
    '23502': {
        status: HttpStatus.BAD_REQUEST,
        message: 'A required field is missing',
        error: 'Bad request'
    }
}

const DEFAULT_DATABASE_ERROR = {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'A database error occurred',
    error: 'Database Error',
}

interface ErrorResponse {
    statusCode: number;
    success: false;
    message: string | string[];
    error: string;
    timestamp: string;
    path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

    private readonly logger = new Logger(GlobalExceptionFilter.name);

    private static readonly SENSITIVE_FIELDS = new Set([
        'password',
        'repeatPassword',
        'refreshToken',
        'accessToken',
        'token',
        'secret',
        'authorization',
        'cookie'
    ]);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request: Request = ctx.getRequest();
        const response: Response = ctx.getResponse();

        try {
            const { status, message, error } = this.resolveException(exception);

            this.logException(request, exception, status);

            const body: ErrorResponse = {
                statusCode: status,
                success: false,
                message,
                error,
                timestamp: new Date().toISOString(),
                path: request.originalUrl
            };

            response.status(status).json(body);
        } catch (fallbackError: unknown) {
            this.handleFallback(request, response, fallbackError);
        }
    }

    private readonly exceptionMapper = {

    }

    private resolveException(exception: unknown): ResolvedException {
        // 1) NestJS HTTP exceptions
        if (exception instanceof HttpException) {
            return this.resolveHttpException(exception);
        }

        // 2) TypeORM query failures (unique constraint, FK violation, etc.)
        else if (exception instanceof QueryFailedError) {
            return this.resolveQueryFailedError(exception);
        }

        // 3) TypeORM entity not found
        else if (exception instanceof EntityNotFoundError) {
            return {
                status: HttpStatus.NOT_FOUND,
                message: 'The requested resource was not found',
                error: 'Not Found'
            }
        }

        // 4) Other TypeORM errors
        else if (exception instanceof TypeORMError) {
            return {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'A database error occurred',
                error: 'Database Error'
            }
        }

        // 5) Malformed JSON in request body
        if (exception instanceof SyntaxError && 'body' in exception) {
            return {
                status: HttpStatus.BAD_REQUEST,
                message: 'Invalid JSON in request body',
                error: 'Bad Request'
            };
        }

        // 6) Everything else
        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'An unexpected error occured',
            error: 'Internal Server Error'
        }
    }

    private resolveQueryFailedError(exception: QueryFailedError<PostgresError>): ResolvedException {
        const driverError = exception.driverError;
        const code: string = driverError?.code;

        return DATABASE_ERROR_MAP[code] || DEFAULT_DATABASE_ERROR;
    }

    private resolveHttpException(exception: HttpException): ResolvedException {
        const status = exception.getStatus();
        const res = exception.getResponse();

        if (typeof res === 'string') {
            return {
                status,
                message: res,
                error: exception.name
            }
        }

        const body = res as Record<string, any>;

        return {
            status,
            // throw new HttpException({ info: 'Token expired', code: 99 }, 401); - no message in body
            message: body.message ?? exception.message,
            error: body.error ?? exception.name
        }
    }

    private handleFallback(request: Request, response: Response, err: unknown) {
        const requestId = this.getRequestId(request);

        this.logger.error(
            `GlobalExceptionFilter itself threw: ${err instanceof Error ? err.message : err}`,
            `[${request.method} ${request.originalUrl}] {reqID: ${requestId}}`,
        );

        if (!response.headersSent) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    success: false,
                    message: 'An unexpected error occurred',
                    error: 'Internal Server Error',
                    timestamp: new Date().toISOString(),
                    path: request.originalUrl,
                });
        }
    }

    private logException(request: Request, exception: unknown, status: number) {
        const { method, originalUrl } = request;

        const requestId = this.getRequestId(request);
        const context = `[${method} ${originalUrl}] {reqID: ${requestId}}`;

        this.logger.debug(
            `${method} ${originalUrl} | Query: ${JSON.stringify(request.query)} | Body: ${JSON.stringify(this.sanitizeBody(request.body))}`,
            context,
        );

        const logPayload = {
            status,
            message: exception instanceof Error ? exception.message : String(exception),
            ...(exception instanceof Error && { stack: exception.stack }),
        };

        if (status >= 500) {
            this.logger.error(JSON.stringify(logPayload), context);
        } else {
            this.logger.warn(JSON.stringify(logPayload), context);
        }
    }

    private getRequestId(request: Request): string {
        return (request.headers['x-request-id'] as string) || 'N/A';
    }

    private sanitizeBody(body: unknown): unknown {
        if (!body || typeof body !== 'object') return body;

        if (Array.isArray(body)) {
            return body.map((item) => this.sanitizeBody(item));
        }

        const sanitized: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(body)) {
            if (GlobalExceptionFilter.SENSITIVE_FIELDS.has(key.toLowerCase())) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeBody(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }
}