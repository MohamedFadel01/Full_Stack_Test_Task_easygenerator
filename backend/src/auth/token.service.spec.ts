import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { TokenService } from './token.service.js';
import type { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import type { UsersRepository } from '../users/repositories/users.repository.js';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let usersRepository: UsersRepository;
  let refreshTokenRepository: RefreshTokenRepository;
  let response: Response;

  const verifiedAuth = {
    id: '507f1f77bcf86cd799439011',
    email: 'user@example.com',
    name: 'Jane',
    emailVerifiedAt: new Date(),
    tokenVersion: 0,
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jwtService = {
      sign: vi.fn().mockReturnValue('access-token'),
    } as unknown as JwtService;
    configService = {
      get: vi.fn((key: string, fallback?: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
          REFRESH_COOKIE_NAME: 'refresh_token',
          COOKIE_SECURE: 'false',
          COOKIE_SAME_SITE: 'lax',
        };
        return values[key] ?? fallback;
      }),
      getOrThrow: vi.fn(),
    } as unknown as ConfigService;
    usersRepository = {
      findByIdWithAuthFields: vi.fn().mockResolvedValue(verifiedAuth),
      incrementTokenVersion: vi.fn().mockResolvedValue(1),
    } as unknown as UsersRepository;
    refreshTokenRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'refresh-id',
        userId: verifiedAuth.id,
        familyId: 'family',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        replacedByTokenId: null,
      }),
      findByTokenHash: vi.fn(),
      revokeById: vi.fn(),
      revokeFamily: vi.fn(),
    } as unknown as RefreshTokenRepository;
    response = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;

    service = new TokenService(
      jwtService,
      configService,
      usersRepository,
      refreshTokenRepository,
    );
  });

  it('signAccessToken includes typ and ver claims', () => {
    service.signAccessToken('user-id', 2);
    expect(jwtService.sign).toHaveBeenCalledWith(
      { sub: 'user-id', ver: 2, typ: 'access' },
      { expiresIn: '15m' },
    );
  });

  it('issueSession sets refresh cookie and returns access token', async () => {
    const session = await service.issueSession(verifiedAuth.id, response);
    expect(session.accessToken).toBe('access-token');
    expect(response.cookie).toHaveBeenCalled();
    expect(refreshTokenRepository.create).toHaveBeenCalled();
  });

  it('refreshSession rejects missing cookie', async () => {
    const request = { cookies: {} } as Request;
    await expect(
      service.refreshSession(request, response),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
