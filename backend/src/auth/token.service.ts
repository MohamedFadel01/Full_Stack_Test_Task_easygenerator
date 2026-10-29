import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { USERS_REPOSITORY } from '../users/repositories/users.repository.js';
import type {
  SafeUser,
  UsersRepository,
} from '../users/repositories/users.repository.js';
import {
  clearRefreshTokenCookie,
  readRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from './auth-cookies.js';
import { generateOpaqueToken, hashOpaqueToken } from './opaque-token.js';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from './repositories/refresh-token.repository.js';

export type SessionTokens = {
  accessToken: string;
  user: SafeUser;
};

function toSafeUserFromAuth(record: {
  id: string;
  email: string;
  name: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    emailVerifiedAt: record.emailVerifiedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  getAccessExpiresIn(): StringValue {
    return (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ??
      this.configService.get<string>('JWT_EXPIRES_IN') ??
      '15m') as StringValue;
  }

  getRefreshExpiresMs(): number {
    const raw =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    return parseDurationToMs(raw);
  }

  signAccessToken(userId: string, tokenVersion: number): string {
    return this.jwtService.sign(
      { sub: userId, ver: tokenVersion, typ: 'access' },
      { expiresIn: this.getAccessExpiresIn() },
    );
  }

  async issueSession(
    userId: string,
    response: Response,
  ): Promise<SessionTokens> {
    const auth = await this.usersRepository.findByIdWithAuthFields(userId);
    if (!auth?.emailVerifiedAt) {
      throw new UnauthorizedException('Email not verified');
    }

    const accessToken = this.signAccessToken(auth.id, auth.tokenVersion);
    const refreshToken = await this.persistRefreshToken(auth.id);
    setRefreshTokenCookie(
      this.configService,
      response,
      refreshToken,
      this.getRefreshExpiresMs(),
    );

    return {
      accessToken,
      user: toSafeUserFromAuth(auth),
    };
  }

  async refreshSession(
    request: Request,
    response: Response,
  ): Promise<SessionTokens> {
    const refreshToken = readRefreshTokenFromRequest(
      this.configService,
      request,
    );
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = hashOpaqueToken(refreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.replacedByTokenId) {
      await this.refreshTokenRepository.revokeFamily(stored.familyId);
      await this.usersRepository.incrementTokenVersion(stored.userId);
      clearRefreshTokenCookie(this.configService, response);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const auth = await this.usersRepository.findByIdWithAuthFields(
      stored.userId,
    );
    if (!auth?.emailVerifiedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newRefreshToken = generateOpaqueToken();
    const newRecord = await this.refreshTokenRepository.create({
      userId: stored.userId,
      familyId: stored.familyId,
      tokenHash: hashOpaqueToken(newRefreshToken),
      expiresAt: new Date(Date.now() + this.getRefreshExpiresMs()),
    });

    await this.refreshTokenRepository.revokeById(stored.id, newRecord.id);

    setRefreshTokenCookie(
      this.configService,
      response,
      newRefreshToken,
      this.getRefreshExpiresMs(),
    );

    return {
      accessToken: this.signAccessToken(auth.id, auth.tokenVersion),
      user: toSafeUserFromAuth(auth),
    };
  }

  async logout(request: Request, response: Response): Promise<void> {
    const refreshToken = readRefreshTokenFromRequest(
      this.configService,
      request,
    );
    if (refreshToken) {
      const stored = await this.refreshTokenRepository.findByTokenHash(
        hashOpaqueToken(refreshToken),
      );
      if (stored && !stored.revokedAt) {
        await this.refreshTokenRepository.revokeById(stored.id);
        await this.usersRepository.incrementTokenVersion(stored.userId);
      }
    }
    clearRefreshTokenCookie(this.configService, response);
  }

  private async persistRefreshToken(userId: string): Promise<string> {
    const refreshToken = generateOpaqueToken();
    await this.refreshTokenRepository.create({
      userId,
      familyId: randomUUID(),
      tokenHash: hashOpaqueToken(refreshToken),
      expiresAt: new Date(Date.now() + this.getRefreshExpiresMs()),
    });
    return refreshToken;
  }
}

function parseDurationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const amount = Number.parseInt(match[1]!, 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * (multipliers[unit!] ?? multipliers.d!);
}
