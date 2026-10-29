import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { PasswordHasher } from './password-hasher.js';
import { SignInUseCase } from './sign-in.use-case.js';
import { TokenService } from './token.service.js';
import { UsersRepository } from '../users/repositories/users.repository.js';

describe('SignInUseCase', () => {
  let useCase: SignInUseCase;
  let usersRepository: UsersRepository;
  let passwordHasher: PasswordHasher;
  let tokenService: TokenService;
  let response: Response;

  const recordWithHash = {
    id: '507f1f77bcf86cd799439011',
    email: 'user@example.com',
    name: 'Jane Doe',
    passwordHash: 'stored-hash',
    emailVerifiedAt: new Date('2026-01-02T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    usersRepository = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findByEmailWithPasswordHash: vi.fn(),
      findById: vi.fn(),
      findByIdWithAuthFields: vi.fn(),
      setEmailVerificationToken: vi.fn(),
      clearEmailVerificationToken: vi.fn(),
      markEmailVerified: vi.fn(),
      incrementTokenVersion: vi.fn(),
      findByEmailVerificationTokenHash: vi.fn(),
    };
    passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn().mockResolvedValue(true),
    };
    tokenService = {
      issueSession: vi.fn().mockResolvedValue({
        accessToken: 'jwt-token',
        user: recordWithHash,
      }),
    } as unknown as TokenService;
    response = {} as Response;

    useCase = new SignInUseCase(usersRepository, passwordHasher, tokenService);
  });

  it('returns session for verified user with valid credentials', async () => {
    vi.mocked(usersRepository.findByEmailWithPasswordHash).mockResolvedValue(
      recordWithHash,
    );

    const result = await useCase.execute(
      {
        email: 'user@example.com',
        password: 'Secret1!',
      },
      response,
    );

    expect(tokenService.issueSession).toHaveBeenCalledWith(
      recordWithHash.id,
      response,
    );
    expect(result.accessToken).toBe('jwt-token');
  });

  it('throws ForbiddenException when email is not verified', async () => {
    vi.mocked(usersRepository.findByEmailWithPasswordHash).mockResolvedValue({
      ...recordWithHash,
      emailVerifiedAt: null,
    });

    await expect(
      useCase.execute(
        { email: 'user@example.com', password: 'Secret1!' },
        response,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws UnauthorizedException for unknown email', async () => {
    vi.mocked(usersRepository.findByEmailWithPasswordHash).mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute(
        { email: 'missing@example.com', password: 'Secret1!' },
        response,
      ),
    ).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    });
  });

  it('throws UnauthorizedException for invalid password', async () => {
    vi.mocked(usersRepository.findByEmailWithPasswordHash).mockResolvedValue(
      recordWithHash,
    );
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'wrong' }, response),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws InternalServerErrorException on repository failure', async () => {
    vi.mocked(usersRepository.findByEmailWithPasswordHash).mockRejectedValue(
      new Error('db down'),
    );

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'Secret1!' }, response),
    ).rejects.toMatchObject({ status: 500 });
  });
});
