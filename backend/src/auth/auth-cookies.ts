import type { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

export function getRefreshCookieName(configService: ConfigService): string {
  return configService.get<string>('REFRESH_COOKIE_NAME', 'refresh_token');
}

export function getRefreshCookieOptions(
  configService: ConfigService,
  maxAgeMs: number,
): CookieOptions {
  const secure = configService.get<string>('COOKIE_SECURE', 'false') === 'true';
  const sameSite = (configService.get<string>('COOKIE_SAME_SITE', 'lax') ??
    'lax') as CookieOptions['sameSite'];

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/auth',
    maxAge: maxAgeMs,
  };
}

export function setRefreshTokenCookie(
  configService: ConfigService,
  response: Response,
  refreshToken: string,
  maxAgeMs: number,
): void {
  response.cookie(
    getRefreshCookieName(configService),
    refreshToken,
    getRefreshCookieOptions(configService, maxAgeMs),
  );
}

export function clearRefreshTokenCookie(
  configService: ConfigService,
  response: Response,
): void {
  response.clearCookie(getRefreshCookieName(configService), {
    httpOnly: true,
    path: '/api/auth',
  });
}

export function readRefreshTokenFromRequest(
  configService: ConfigService,
  request: Request,
): string | undefined {
  const name = getRefreshCookieName(configService);
  const cookies = request.cookies as Record<string, string | undefined>;
  return cookies[name];
}
