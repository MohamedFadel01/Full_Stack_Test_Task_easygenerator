import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { Model } from 'mongoose';
import { User, type UserDocument } from '../src/users/schemas/user.schema.js';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './helpers/mongo-memory.js';
import { applyAppConfiguration } from './helpers/nest-app.js';
import {
  applyAuthE2eEnv,
  registerAndVerifyUser,
  resetCapturedEmails,
} from './helpers/auth-e2e.helpers.js';

describe('DELETE /api/auth/account (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: typeof import('../src/app.module.js').AppModule;
  let userModel: Model<UserDocument>;

  beforeAll(async () => {
    applyAuthE2eEnv();
    await startMongoMemoryServer();
    AppModule = (await import('../src/app.module.js')).AppModule;
  });

  afterAll(async () => {
    await stopMongoMemoryServer();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppConfiguration(app);
    await app.init();
    userModel = app.get(getModelToken(User.name));
    resetCapturedEmails(app);
  });

  afterEach(async () => {
    await app?.close();
  });

  const password = 'Secret1!';

  it('deletes account when password is correct', async () => {
    const email = `delete-account-${Date.now()}@example.com`;
    const { accessToken } = await registerAndVerifyUser(app, {
      email,
      name: 'Delete Account',
      password,
    });

    await request(app.getHttpServer())
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password })
      .expect(204);

    const stored = await userModel.findOne({ email: email.toLowerCase() });
    expect(stored).toBeNull();

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('returns 401 for wrong password', async () => {
    const email = `delete-wrong-${Date.now()}@example.com`;
    const { accessToken } = await registerAndVerifyUser(app, {
      email,
      name: 'Wrong Password',
      password,
    });

    await request(app.getHttpServer())
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'WrongPass1!' })
      .expect(401);

    const stored = await userModel.findOne({ email: email.toLowerCase() });
    expect(stored).not.toBeNull();
  });

  it('returns 401 without authentication', async () => {
    await request(app.getHttpServer())
      .delete('/api/auth/account')
      .send({ password: 'Secret1!' })
      .expect(401);
  });
});
