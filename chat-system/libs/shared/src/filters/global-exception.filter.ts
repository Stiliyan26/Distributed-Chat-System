import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";

interface CustomExceptionResponse {
    statusCode: number;
    message: string | string[];
    error: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

    private readonly logger = new Logger(GlobalExceptionFilter.name);
    private readonly SENSITIVE_KEYS = ['password', 'confirmPassword', 'refreshToken', 'accessToken', 'token', 'secret'];

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        try {
            const exceptionInfo = this.extractExceptionInfo(exception);
            this.logException(request, exception, exceptionInfo);
            this.sendResponse(response, exceptionInfo);
        } catch (err) {
            this.handleFallbackError(request, response, err);
        }
    }

    private extractExceptionInfo(exception: unknown) {
        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        if (exception instanceof HttpException) {
            const res = exception.getResponse() as CustomExceptionResponse;

            return {
                status,
                statusCode: res.statusCode || status,
                message: res.message || exception.message,
                error: res.error || exception.name,
                stack: exception.stack
            };
        }

        return {
            status,
            statusCode: status,
            message: exception instanceof Error ? exception.message : 'Internal Server Error',
            error: exception instanceof Error ? exception.name : 'Unknown Error',
            stack: exception instanceof Error ? exception.stack : String(exception)
        };
    }

    private logException(request: Request, exception: unknown, exceptionInfo: ReturnType<typeof this.extractExceptionInfo>) {
        const { method, originalUrl, query, params, headers, body } = request;
        const requestId = (headers as Record<string, string>)?.['requestId'] || 'UNKNOWN';

        const shouldLogBody = !originalUrl.includes('/auth/');
        const bodyLog = shouldLogBody ? `Body: ${JSON.stringify(this.sanitizeBody(body))}` : `Body: [REDACTED FOR AUTH]`;

        this.logger.debug(
            `${method}: ${originalUrl}; Params: ${JSON.stringify(params)}; Query: ${JSON.stringify(query)}; ${bodyLog};`,
            `[DEBUG] [${method}:- ${originalUrl}] {reqID: ${requestId}}`,
        );

        this.logger.error(
            JSON.stringify(exception),
            `ExceptionFilter [${originalUrl}]: {reqID: ${requestId}}`,
        );

        this.logger.error(
            JSON.stringify({ stack: exceptionInfo.stack }),
            `ExceptionFilter-stack [${originalUrl}]: {reqID: ${requestId}}`,
        );
    }

    private sendResponse(response: Response, exceptionInfo: ReturnType<typeof this.extractExceptionInfo>) {
        response.status(exceptionInfo.status).json({
            statusCode: exceptionInfo.statusCode,
            success: false,
            message: exceptionInfo.message
        });
    }

    private handleFallbackError(request: Request, response: Response, err: unknown) {
        const originalUrl = request.originalUrl;
        const requestId = (request.headers as Record<string, string>)?.['requestId'] || 'UNKNOWN';

        this.logger.error(
            `Unexpected error in GlobalExceptionFilter: ${err}`,
            `ExceptionFilter [${originalUrl}]: {reqID: ${requestId}}`,
        );

        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'An unexpected error occurred',
        });
    }

    private sanitizeBody(body: any): any {
        if (!body || typeof body !== 'object') return body;

        const sanitized = { ...body };
        for (const key of this.SENSITIVE_KEYS) {
            if (key in sanitized) sanitized[key] = '[REDACTED]';
        }
        return sanitized;
    }
}