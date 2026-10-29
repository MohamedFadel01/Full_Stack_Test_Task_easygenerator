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

describe('Auth rate limiting (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: typeof import('../src/app.module.js').AppModule;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-e2e';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.THROTTLE_LIMIT = '2';
    process.env.THROTTLE_TTL_MS = '60000';
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

  it('returns 429 when auth sign-in rate limit is exceeded', async () => {
    const payload = {
      email: 'throttle@example.com',
      password: 'Secret1!',
    };

    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send(payload)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send(payload)
      .expect(401);

    const throttled = await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send(payload);

    expect(throttled.status).toBe(429);
  });

  it('still allows GET /api/health when auth routes are throttled', async () => {
    const payload = {
      email: 'health-throttle@example.com',
      password: 'Secret1!',
    };

    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send(payload)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send(payload)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send(payload)
      .expect(429);

    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
  });
});
