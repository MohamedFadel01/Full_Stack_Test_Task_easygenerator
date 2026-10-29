import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
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
  resetCapturedEmails,
} from './helpers/auth-e2e.helpers.js';

describe('GET /api/auth/me (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: typeof import('../src/app.module.js').AppModule;
  const jwtSecret = 'test-jwt-secret-for-e2e';

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

  async function obtainAccessToken(): Promise<string> {
    const signUpBody = {
      email: `me-user-${Date.now()}@example.com`,
      name: 'Me User',
      password: 'Secret1!',
    };

    const { accessToken } = await registerAndVerifyUser(app, signUpBody);
    return accessToken;
  }

  it('returns 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('returns 401 for malformed Authorization header', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'NotBearer token')
      .expect(401);
  });

  it('returns 401 for invalid token signature', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);
  });

  it('returns 401 for expired access token', async () => {
    const token = jwt.sign(
      { sub: '507f1f77bcf86cd799439011', ver: 0, typ: 'access' },
      jwtSecret,
      { expiresIn: '-1s' },
    );

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('returns 401 when token subject user does not exist', async () => {
    const token = jwt.sign(
      { sub: '507f1f77bcf86cd799439011', ver: 0, typ: 'access' },
      jwtSecret,
    );

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('returns 401 when token subject is not a valid user id', async () => {
    const token = jwt.sign(
      { sub: 'not-a-valid-object-id', ver: 0, typ: 'access' },
      jwtSecret,
    );

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('returns 401 for legacy JWT without typ/ver claims', async () => {
    const token = jwt.sign({ sub: '507f1f77bcf86cd799439011' }, jwtSecret);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('returns 200 with safe user profile when authenticated', async () => {
    const accessToken = await obtainAccessToken();

    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.user).toMatchObject({
      email: expect.stringMatching(/@example\.com$/),
      name: 'Me User',
    });
    expect(response.body.user.id).toEqual(expect.any(String));
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });
});
