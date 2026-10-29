import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';
import { UsersRepository } from '../users/repositories/users.repository.js';

describe('GetCurrentUserUseCase', () => {
  let useCase: GetCurrentUserUseCase;
  let usersRepository: UsersRepository;

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
    useCase = new GetCurrentUserUseCase(usersRepository);
  });

  it('returns user when found', async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(safeUser);

    const result = await useCase.execute(safeUser.id);
    expect(result).toEqual({ user: safeUser });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('throws UnauthorizedException when user not found', async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute(safeUser.id)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when user id is invalid', async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute('not-a-valid-object-id'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
