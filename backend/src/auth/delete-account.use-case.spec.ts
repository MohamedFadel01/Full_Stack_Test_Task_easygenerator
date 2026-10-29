import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { DeleteAccountUseCase } from './delete-account.use-case.js';
import type { PasswordHasher } from './password-hasher.js';
import type { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import type { TokenService } from './token.service.js';
import type { UsersRepository } from '../users/repositories/users.repository.js';

describe('DeleteAccountUseCase', () => {
  let useCase: DeleteAccountUseCase;
  let usersRepository: UsersRepository;
  let refreshTokenRepository: RefreshTokenRepository;
  let passwordHasher: PasswordHasher;
  let tokenService: TokenService;
  let request: Request;
  let response: Response;

  const authUser = {
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
    usersRepository = {
      findByIdWithAuthFields: vi.fn().mockResolvedValue(authUser),
      deleteById: vi.fn().mockResolvedValue(true),
    } as unknown as UsersRepository;
    refreshTokenRepository = {
      deleteByUserId: vi.fn().mockResolvedValue(undefined),
    } as unknown as RefreshTokenRepository;
    passwordHasher = {
      compare: vi.fn().mockResolvedValue(true),
      hash: vi.fn(),
    };
    tokenService = {
      logout: vi.fn().mockResolvedValue(undefined),
    } as unknown as TokenService;
    request = {} as Request;
    response = {} as Response;

    useCase = new DeleteAccountUseCase(
      usersRepository,
      refreshTokenRepository,
      passwordHasher,
      tokenService,
    );
  });

  it('deletes user data, refresh tokens, and clears session when password matches', async () => {
    await useCase.execute({
      userId: authUser.id,
      password: 'Secret1!',
      request,
      response,
    });

    expect(passwordHasher.compare).toHaveBeenCalledWith('Secret1!', 'hash');
    expect(refreshTokenRepository.deleteByUserId).toHaveBeenCalledWith(
      authUser.id,
    );
    expect(usersRepository.deleteById).toHaveBeenCalledWith(authUser.id);
    expect(tokenService.logout).toHaveBeenCalledWith(request, response);
  });

  it('throws UnauthorizedException when password is wrong', async () => {
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: authUser.id,
        password: 'wrong',
        request,
        response,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersRepository.deleteById).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when user no longer exists', async () => {
    vi.mocked(usersRepository.findByIdWithAuthFields).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: authUser.id,
        password: 'Secret1!',
        request,
        response,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws InternalServerErrorException when delete fails', async () => {
    vi.mocked(usersRepository.deleteById).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: authUser.id,
        password: 'Secret1!',
        request,
        response,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
