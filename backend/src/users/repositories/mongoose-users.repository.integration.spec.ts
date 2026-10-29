import { getModelToken } from '@nestjs/mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from '../../../test/helpers/mongo-memory.js';
import { DuplicateEmailError } from '../errors/duplicate-email.error.js';
import { User, UserDocument } from '../schemas/user.schema.js';
import { UsersModule } from '../users.module.js';
import { USERS_REPOSITORY, UsersRepository } from './users.repository.js';

describe('MongooseUsersRepository (integration)', () => {
  let repository: UsersRepository;
  let userModel: Model<UserDocument>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    vi.setConfig({ testTimeout: 60_000 });
    await startMongoMemoryServer();

    moduleRef = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(process.env.MONGODB_URI!), UsersModule],
    }).compile();

    repository = moduleRef.get<UsersRepository>(USERS_REPOSITORY);
    userModel = moduleRef.get<Model<UserDocument>>(getModelToken(User.name));
  }, 60_000);

  afterAll(async () => {
    await moduleRef?.close();
    await stopMongoMemoryServer();
  });

  it('create returns SafeUser with normalized email and no passwordHash', async () => {
    const user = await repository.create({
      email: '  User@Example.COM ',
      name: 'Jane Doe',
      passwordHash: 'hashed-password-fixture',
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('user@example.com');
    expect(user.name).toBe('Jane Doe');
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('findByEmail finds user by mixed-case email', async () => {
    await repository.create({
      email: 'findme@example.com',
      name: 'Find Me',
      passwordHash: 'hash',
    });

    const found = await repository.findByEmail('  FINDME@Example.com  ');
    expect(found?.email).toBe('findme@example.com');
    expect(found).not.toHaveProperty('passwordHash');
  });

  it('findByEmail returns null when user does not exist', async () => {
    const found = await repository.findByEmail('missing@example.com');
    expect(found).toBeNull();
  });

  it('create throws DuplicateEmailError for duplicate email', async () => {
    await repository.create({
      email: 'dup@example.com',
      name: 'First',
      passwordHash: 'hash1',
    });

    await expect(
      repository.create({
        email: 'DUP@example.com',
        name: 'Second',
        passwordHash: 'hash2',
      }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });

  it('stores passwordHash in database but does not expose it via repository', async () => {
    const fixtureHash = 'stored-hash-value';
    const user = await repository.create({
      email: 'secure@example.com',
      name: 'Secure User',
      passwordHash: fixtureHash,
    });

    const fromRepo = await repository.findByEmail('secure@example.com');
    expect(fromRepo).not.toHaveProperty('passwordHash');

    const raw = await userModel
      .findById(user.id)
      .select('+passwordHash')
      .exec();
    expect(raw?.passwordHash).toBe(fixtureHash);
  });

  it('findByEmailWithPasswordHash returns hash for authentication', async () => {
    const fixtureHash = 'auth-hash-value';
    await repository.create({
      email: 'authlookup@example.com',
      name: 'Auth Lookup',
      passwordHash: fixtureHash,
    });

    const record = await repository.findByEmailWithPasswordHash(
      'AUTHLOOKUP@example.com',
    );
    expect(record?.email).toBe('authlookup@example.com');
    expect(record?.passwordHash).toBe(fixtureHash);
  });

  it('findById returns SafeUser without passwordHash', async () => {
    const created = await repository.create({
      email: 'byid@example.com',
      name: 'By Id',
      passwordHash: 'hash',
    });

    const found = await repository.findById(created.id);
    expect(found?.email).toBe('byid@example.com');
    expect(found).not.toHaveProperty('passwordHash');
  });

  it('findById returns null for invalid id without throwing', async () => {
    await expect(
      repository.findById('not-a-valid-object-id'),
    ).resolves.toBeNull();
  });
});
