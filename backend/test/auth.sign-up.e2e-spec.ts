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

describe('POST /api/auth/sign-up (e2e)', () => {
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

  const validBody = {
    email: 'signup@example.com',
    name: 'Jane Doe',
    password: 'Secret1!',
  };

  it('returns 201 with user and accessToken for valid registration', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send(validBody)
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: 'signup@example.com',
      name: 'Jane Doe',
    });
    expect(response.body.user.id).toEqual(expect.any(String));
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 400 when required fields are missing', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ email: 'only@example.com' })
      .expect(400);
  });

  it('returns 400 for invalid email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ ...validBody, email: 'not-an-email' })
      .expect(400);
  });

  it('returns 400 when name is too short after trim', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ ...validBody, name: '  ab  ' })
      .expect(400);
  });

  it('returns 400 when password is too short', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ ...validBody, password: 'Sec1!' })
      .expect(400);
  });

  it('returns 400 when password has no digit', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ ...validBody, password: 'Secret!!!!' })
      .expect(400);
  });

  it('returns 400 when password has no special character', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ ...validBody, password: 'Secret12' })
      .expect(400);
  });

  it('returns 409 when email is already registered', async () => {
    const body = {
      ...validBody,
      email: 'duplicate409@example.com',
    };

    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send(body)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ ...body, name: 'Another Name' })
      .expect(409);
  });
});
