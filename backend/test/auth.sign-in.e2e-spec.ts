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

describe('POST /api/auth/sign-in (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: typeof import('../src/app.module.js').AppModule;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-e2e';
    process.env.JWT_EXPIRES_IN = '1h';
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
  });

  afterEach(async () => {
    await app?.close();
  });

  const registeredUser = {
    email: 'signin-user@example.com',
    name: 'Sign In User',
    password: 'Secret1!',
  };

  async function registerUser(
    overrides: Partial<typeof registeredUser> = {},
  ): Promise<void> {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ ...registeredUser, ...overrides })
      .expect(201);
  }

  it('returns 200 with user and accessToken for valid credentials', async () => {
    await registerUser({ email: 'valid-signin@example.com' });

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
    await registerUser({ email: 'wrong-pass@example.com' });

    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email: 'wrong-pass@example.com', password: 'WrongPass1!' })
      .expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });
});
