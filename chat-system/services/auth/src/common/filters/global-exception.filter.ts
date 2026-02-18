import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { TypeORMError } from "typeorm";

interface CustomExceptionResponse {
    statusCode: number;
    message: string | string[];
    error: string;
}

@Catch(HttpException, TypeORMError)
export class GlobalExceptionFilter<T extends HttpException | TypeORMError> implements ExceptionFilter {

    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: T, host: ArgumentsHost) {
        const ctx = host.switchToHttp();

        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const { method, originalUrl, query, headers, params, body } = request;

        const requestId = (headers as Record<string, string>)?.['requestId'];

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        try {
            const { statusCode, message, error }: CustomExceptionResponse =
                exception instanceof HttpException
                    ? (exception.getResponse() as CustomExceptionResponse)
                    : {
                        statusCode: status,
                        message: exception.message,
                        error: exception.name
                    };

            const stack = exception['stack'] || message;

            this.logger.debug(
                `${method}: ${originalUrl}; Params: ${JSON.stringify(params)}; Query: ${JSON.stringify(query)}; Body: ${JSON.stringify(body)};`,
                `[DEBUG] [${method}:- ${originalUrl}] {reqID: ${requestId}}`,
            );

            this.logger.error(
                JSON.stringify(exception),
                `ExceptionFilter [${originalUrl}]: {reqID: ${requestId}}`,
            );

            this.logger.error(
                JSON.stringify({ stack }),
                `ExceptionFilter-stack [${originalUrl}]: {reqID: ${requestId}}`,
            );

            response.status(status).json({
                statusCode,
                success: false,
                message: message
            });
        } catch (err) {
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
    }
}