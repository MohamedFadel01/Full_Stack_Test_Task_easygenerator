import { getModelToken } from '@nestjs/mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from '../../../test/helpers/mongo-memory.js';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { UsersModule } from '../../users/users.module.js';
import { USERS_REPOSITORY, UsersRepository } from '../../users/repositories/users.repository.js';
import { AuthTokensModule } from '../auth-tokens.module.js';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from './refresh-token.repository.js';
import { RefreshToken, RefreshTokenDocument } from '../schemas/refresh-token.schema.js';

describe('MongooseRefreshTokenRepository (integration)', () => {
  let refreshRepository: RefreshTokenRepository;
  let usersRepository: UsersRepository;
  let refreshModel: Model<RefreshTokenDocument>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    vi.setConfig({ testTimeout: 60_000 });
    await startMongoMemoryServer();

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGODB_URI!),
        UsersModule,
        AuthTokensModule,
      ],
    }).compile();

    refreshRepository = moduleRef.get<RefreshTokenRepository>(
      REFRESH_TOKEN_REPOSITORY,
    );
    usersRepository = moduleRef.get<UsersRepository>(USERS_REPOSITORY);
    refreshModel = moduleRef.get<Model<RefreshTokenDocument>>(
      getModelToken(RefreshToken.name),
    );
  }, 60_000);

  afterAll(async () => {
    await moduleRef?.close();
    await stopMongoMemoryServer();
  });

  it('creates and finds refresh token by hash', async () => {
    const user = await usersRepository.create({
      email: 'refresh@example.com',
      name: 'Refresh User',
      passwordHash: 'hash',
    });

    const record = await refreshRepository.create({
      userId: user.id,
      familyId: 'family-uuid-1',
      tokenHash: 'refresh-hash-1',
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    expect(record.id).toBeDefined();
    expect(record.userId).toBe(user.id);
    expect(record.revokedAt).toBeNull();

    const found = await refreshRepository.findByTokenHash('refresh-hash-1');
    expect(found?.id).toBe(record.id);
  });

  it('revokeById marks token revoked with optional replacement id', async () => {
    const user = await usersRepository.create({
      email: 'revoke@example.com',
      name: 'Revoke',
      passwordHash: 'hash',
    });

    const oldToken = await refreshRepository.create({
      userId: user.id,
      familyId: 'family-revoke',
      tokenHash: 'old-hash',
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    const newToken = await refreshRepository.create({
      userId: user.id,
      familyId: 'family-revoke',
      tokenHash: 'new-hash',
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    await refreshRepository.revokeById(oldToken.id, newToken.id);

    const raw = await refreshModel.findById(oldToken.id).exec();
    expect(raw?.revokedAt).toBeInstanceOf(Date);
    expect(raw?.replacedByTokenId?.toString()).toBe(newToken.id);
  });

  it('revokeFamily revokes all active tokens in family', async () => {
    const user = await usersRepository.create({
      email: 'family@example.com',
      name: 'Family',
      passwordHash: 'hash',
    });
    const familyId = 'family-bulk';

    await refreshRepository.create({
      userId: user.id,
      familyId,
      tokenHash: 'f1',
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    await refreshRepository.create({
      userId: user.id,
      familyId,
      tokenHash: 'f2',
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    await refreshRepository.revokeFamily(familyId);

    const active = await refreshModel
      .find({ familyId, revokedAt: null })
      .exec();
    expect(active).toHaveLength(0);
  });
});
