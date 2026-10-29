import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DuplicateEmailError } from '../users/errors/duplicate-email.error.js';
import type { EmailService } from '../email/email.service.interface.js';
import { PasswordHasher } from './password-hasher.js';
import { RegisterUserUseCase } from './register-user.use-case.js';
import { UsersRepository } from '../users/repositories/users.repository.js';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let usersRepository: UsersRepository;
  let passwordHasher: PasswordHasher;
  let emailService: EmailService;
  let configService: ConfigService;

  const safeUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'user@example.com',
    name: 'Jane Doe',
    emailVerifiedAt: null,
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
      hash: vi.fn().mockResolvedValue('hashed-password'),
      compare: vi.fn(),
    };
    emailService = {
      sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
      getCapturedVerificationEmails: vi.fn().mockReturnValue([]),
      clearCapturedVerificationEmails: vi.fn(),
    };
    configService = {
      get: vi.fn().mockReturnValue('http://localhost:5173'),
    } as unknown as ConfigService;

    useCase = new RegisterUserUseCase(
      usersRepository,
      passwordHasher,
      emailService,
      configService,
    );
  });

  it('registers a user, stores verification token, and sends email without JWT', async () => {
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
    expect(usersRepository.setEmailVerificationToken).toHaveBeenCalledWith(
      safeUser.id,
      expect.any(String),
      expect.any(Date),
    );
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      safeUser.email,
      expect.stringContaining('/verify-email?token='),
    );
    expect(result.user).toEqual(safeUser);
    expect(result.message).toMatch(/check your email/i);
    expect(result).not.toHaveProperty('accessToken');
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
