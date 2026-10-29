import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpLoggingInterceptor } from './http-logging.interceptor.js';

describe.sequential('HttpLoggingInterceptor', () => {
  let interceptor: HttpLoggingInterceptor;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    interceptor = new HttpLoggingInterceptor();
    logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  function createContext(
    method: string,
    originalUrl: string,
    statusCode = 200,
  ): ExecutionContext {
    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({ method, originalUrl }),
        getResponse: () => ({ statusCode }),
      }),
    } as ExecutionContext;
  }

  it('logs successful HTTP requests except health checks', async () => {
    const context = createContext('POST', '/api/auth/sign-in', 200);
    const next: CallHandler = { handle: () => of({ ok: true }) };

    await lastValueFrom(interceptor.intercept(context, next));

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^POST \/api\/auth\/sign-in 200 \d+ms$/),
    );
  });

  it('does not log GET /api/health probes', async () => {
    logSpy.mockClear();
    warnSpy.mockClear();
    const context = createContext('GET', '/api/health', 200);
    const next: CallHandler = { handle: () => of({ status: 'ok' }) };

    await lastValueFrom(interceptor.intercept(context, next));

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('logs failed requests with warn and status code', async () => {
    const context = createContext('POST', '/api/auth/sign-in', 401);
    const next: CallHandler = {
      handle: () =>
        throwError(() => ({ status: 401, message: 'Unauthorized' })),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toEqual(expect.objectContaining({ status: 401 }));

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^POST \/api\/auth\/sign-in 401 \d+ms$/),
    );
  });
});
