import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

function isHealthProbeRequest(method: string, url: string): boolean {
  return method === 'GET' && (url === '/api/health' || url.endsWith('/health'));
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const { method } = request;
    const url = request.originalUrl;

    if (isHealthProbeRequest(method, url)) {
      return next.handle();
    }

    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = http.getResponse<Response>();
          const durationMs = Date.now() - started;
          this.logger.log(
            `${method} ${url} ${response.statusCode} ${durationMs}ms`,
          );
        },
        error: (error: unknown) => {
          const durationMs = Date.now() - started;
          const statusCode =
            error &&
            typeof error === 'object' &&
            'status' in error &&
            typeof (error as { status?: unknown }).status === 'number'
              ? (error as { status: number }).status
              : 500;
          this.logger.warn(`${method} ${url} ${statusCode} ${durationMs}ms`);
        },
      }),
    );
  }
}
