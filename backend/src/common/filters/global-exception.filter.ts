import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        error = (b['error'] as string) ?? HttpStatus[statusCode] ?? 'ERROR';
        message = (b['message'] as string) ?? exception.message;
      } else {
        message = String(body);
        error = HttpStatus[statusCode] ?? 'ERROR';
      }
    }

    if (statusCode >= 500) {
      this.logger.error(
        { requestId: req.requestId, path: req.path, method: req.method, statusCode },
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.log(
        { requestId: req.requestId, path: req.path, method: req.method, statusCode, error },
        message,
      );
    }

    res.status(statusCode).json({
      statusCode,
      error,
      message,
      requestId: req.requestId,
    });
  }
}
