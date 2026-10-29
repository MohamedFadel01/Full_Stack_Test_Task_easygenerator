import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DuplicateEmailError } from '../users/errors/duplicate-email.error.js';
import { PasswordHasher } from './password-hasher.js';
import { RegisterUserUseCase } from './register-user.use-case.js';
import { UsersRepository } from '../users/repositories/users.repository.js';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let usersRepository: UsersRepository;
  let passwordHasher: PasswordHasher;
  let jwtService: JwtService;

  const safeUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'user@example.com',
    name: 'Jane Doe',
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
      hash: vi.fn().mockResolvedValue('hashed-password'),
      compare: vi.fn(),
    };
    jwtService = {
      sign: vi.fn().mockReturnValue('jwt-token'),
    } as unknown as JwtService;

    useCase = new RegisterUserUseCase(
      usersRepository,
      passwordHasher,
      jwtService,
    );
  });

  it('registers a user with hashed password and returns user with access token', async () => {
    vi.mocked(usersRepository.create).mockResolvedValue(safeUser);

    const result = await useCase.execute({
      email: 'user@example.com',
      name: 'Jane Doe',
      password: 'Secret1!',
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('Secret1!');
    expect(usersRepository.create).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'Jane Doe',
      passwordHash: 'hashed-password',
    });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: safeUser.id });
    expect(result).toEqual({ user: safeUser, accessToken: 'jwt-token' });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('throws ConflictException when email is already registered', async () => {
    vi.mocked(usersRepository.create).mockRejectedValue(
      new DuplicateEmailError(),
    );

    await expect(
      useCase.execute({
        email: 'user@example.com',
        name: 'Jane Doe',
        password: 'Secret1!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws InternalServerErrorException on unexpected repository errors', async () => {
    vi.mocked(usersRepository.create).mockRejectedValue(new Error('db down'));

    await expect(
      useCase.execute({
        email: 'user@example.com',
        name: 'Jane Doe',
        password: 'Secret1!',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
