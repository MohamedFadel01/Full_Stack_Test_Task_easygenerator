import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from 'vitest';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './helpers/mongo-memory.js';
import { applyAppConfiguration } from './helpers/nest-app.js';
import {
  applyAuthE2eEnv,
  registerAndVerifyUser,
  registerUser,
  resetCapturedEmails,
} from './helpers/auth-e2e.helpers.js';

describe('POST /api/auth/sign-in (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: typeof import('../src/app.module.js').AppModule;

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
    resetCapturedEmails(app);
  });

  afterEach(async () => {
    await app?.close();
  });

  const registeredUser = {
    email: 'signin-user@example.com',
    name: 'Sign In User',
    password: 'Secret1!',
  };

  it('returns 200 with user and accessToken for verified user', async () => {
    await registerAndVerifyUser(app, {
      ...registeredUser,
      email: 'valid-signin@example.com',
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        email: 'valid-signin@example.com',
        password: registeredUser.password,
      })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe('valid-signin@example.com');
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/refresh_token=/)]),
    );
  });

  it('returns 403 when email is not verified', async () => {
    await registerUser(app, {
      email: 'unverified@example.com',
      name: 'Unverified',
      password: 'Secret1!',
    });

    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email: 'unverified@example.com', password: 'Secret1!' })
      .expect(403);
  });

  it('returns 400 when fields are missing', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email: 'only@example.com' })
      .expect(400);
  });

  it('returns 400 for invalid email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email: 'bad-email', password: 'Secret1!' })
      .expect(400);
  });

  it('returns 401 with generic message for unknown email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email: 'unknown@example.com', password: 'Secret1!' })
      .expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });

  it('returns 401 with same message for wrong password', async () => {
    await registerAndVerifyUser(app, {
      ...registeredUser,
      email: 'wrong-pass@example.com',
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email: 'wrong-pass@example.com', password: 'WrongPass1!' })
      .expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });
});
