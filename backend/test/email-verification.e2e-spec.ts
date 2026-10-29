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
  expect,
  it,
} from 'vitest';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './helpers/mongo-memory.js';
import { applyAppConfiguration } from './helpers/nest-app.js';
import {
  applyAuthE2eEnv,
  getEmailService,
  registerUser,
  resetCapturedEmails,
} from './helpers/auth-e2e.helpers.js';

describe('Email verification and session cookies (e2e)', () => {
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

  const userBody = {
    email: 'verify-flow@example.com',
    name: 'Verify Flow',
    password: 'Secret1!',
  };

  it('verify-email issues access token and refresh cookie', async () => {
    await registerUser(app, userBody);
    const captured = getEmailService(app).getCapturedVerificationEmails();
    expect(captured).toHaveLength(1);

    const token = new URL(captured[0]!.verifyUrl).searchParams.get('token');
    const response = await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.emailVerifiedAt).toEqual(expect.any(String));
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/refresh_token=/)]),
    );
  });

  it('resend-verification sends another email without enumeration', async () => {
    const email = 'resend@example.com';
    await registerUser(app, { ...userBody, email });

    const response = await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email })
      .expect(200);

    expect(response.body.message).toMatch(/unverified account/i);
    expect(getEmailService(app).getCapturedVerificationEmails()).toHaveLength(
      2,
    );

    const missing = await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email: 'missing@example.com' })
      .expect(200);
    expect(missing.body.message).toBe(response.body.message);
  });

  it('refresh rotates cookie and returns new access token', async () => {
    await registerUser(app, {
      ...userBody,
      email: 'refresh@example.com',
    });
    const captured = getEmailService(app).getCapturedVerificationEmails()[0]!;
    const token = new URL(captured.verifyUrl).searchParams.get('token');

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token })
      .expect(200);

    const cookie = verifyResponse.headers['set-cookie'] as string[];
    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
      .expect(200);

    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.headers['set-cookie']?.[0]).not.toBe(cookie[0]);
  });

  it('logout clears refresh cookie and invalidates access token', async () => {
    await registerUser(app, {
      ...userBody,
      email: 'logout@example.com',
    });
    const captured = getEmailService(app).getCapturedVerificationEmails()[0]!;
    const token = new URL(captured.verifyUrl).searchParams.get('token');

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token })
      .expect(200);

    const accessToken = verifyResponse.body.accessToken as string;
    const cookie = verifyResponse.headers['set-cookie'] as string[];

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });
});
