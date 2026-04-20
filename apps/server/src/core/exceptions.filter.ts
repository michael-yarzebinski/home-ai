import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

function extractMessage(exception: unknown): string {
  if (exception instanceof HttpException) {
    const res = exception.getResponse();
    if (typeof res === 'string') {
      return res;
    }
    if (typeof res === 'object' && res !== null && 'message' in res) {
      const m = (res as { message: unknown }).message;
      if (Array.isArray(m)) {
        return m.join('; ');
      }
      if (typeof m === 'string' && m.length > 0) {
        return m;
      }
    }
    return exception.message || 'Request failed';
  }

  if (exception instanceof Error) {
    const err = exception as Error & { code?: string; errors?: Error[] };
    if (err.name === 'AggregateError' && Array.isArray(err.errors) && err.errors.length > 0) {
      const parts = err.errors.map((e) => e?.message).filter(Boolean);
      if (parts.length > 0) {
        return parts.join('; ');
      }
    }
    if (err.message?.trim()) {
      return err.message;
    }
    if (err.code) {
      return `${err.name} (${err.code})`;
    }
    return err.name || 'Internal server error';
  }

  if (typeof exception === 'string') {
    return exception;
  }

  return 'Internal server error';
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const err = exception as Error & { code?: string; errors?: { code?: string }[] };
    const isDbUnreachable =
      err?.code === 'ECONNREFUSED' ||
      (err?.name === 'AggregateError' &&
        Array.isArray(err.errors) &&
        err.errors.some((e) => e?.code === 'ECONNREFUSED'));
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && isDbUnreachable) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
    }

    const message = extractMessage(exception);

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    // Log the error (we can enhance this later with AuditTool)
    console.error(`[Exception] ${request.method} ${request.url} - ${status}`, exception);

    response.status(status).json(errorResponse);
  }
}