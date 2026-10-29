import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordHasher } from './password-hasher.js';
import { SignInUseCase } from './sign-in.use-case.js';
import { UsersRepository } from '../users/repositories/users.repository.js';

describe('SignInUseCase', () => {
  let useCase: SignInUseCase;
  let usersRepository: UsersRepository;
  let passwordHasher: PasswordHasher;
  let jwtService: JwtService;

  const recordWithHash = {
    id: '507f1f77bcf86cd799439011',
    email: 'user@example.com',
    name: 'Jane Doe',
    passwordHash: 'stored-hash',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    usersRepository = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findByEmailWithPasswordHash: vi.fn(),
      findById: vi.fn(),
    };
    passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn().mockResolvedValue(true),
    };
    jwtService = {
      sign: vi.fn().mockReturnValue('jwt-token'),
    } as unknown as JwtService;

    useCase = new SignInUseCase(usersRepository, passwordHasher, jwtService);
  });

  it('returns user and access token for valid credentials', async () => {
    vi.mocked(usersRepository.findByEmailWithPasswordHash).mockResolvedValue(
      recordWithHash,
    );

    const result = await useCase.execute({
      email: 'user@example.com',
      password: 'Secret1!',
    });

    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'Secret1!',
      'stored-hash',
    );
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: recordWithHash.id });
    expect(result.accessToken).toBe('jwt-token');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('throws UnauthorizedException for unknown email', async () => {
    vi.mocked(usersRepository.findByEmailWithPasswordHash).mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'Secret1!' }),
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
      useCase.execute({ email: 'user@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws InternalServerErrorException on repository failure', async () => {
    vi.mocked(usersRepository.findByEmailWithPasswordHash).mockRejectedValue(
      new Error('db down'),
    );

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'Secret1!' }),
    ).rejects.toMatchObject({ status: 500 });
  });
});
