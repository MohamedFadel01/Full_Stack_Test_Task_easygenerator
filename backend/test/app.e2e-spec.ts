import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
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

describe('AppController (e2e)', () => {
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

  it('/api/health (GET) includes security headers from helmet', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
  });

  it('/api/docs-json (GET) exposes auth sign-up path', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    const body = response.body as { paths?: Record<string, unknown> };
    expect(body.paths?.['/api/auth/sign-up']).toBeDefined();
  });

  it('/api/health (GET) returns 503 when database is disconnected', async () => {
    const { AppController } = await import('../src/app.controller.js');
    const { AppService } = await import('../src/app.service.js');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getConnectionToken(),
          useValue: { readyState: 0 },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (_key: string, defaultValue?: unknown) => defaultValue,
          },
        },
      ],
    }).compile();

    const degradedApp = moduleFixture.createNestApplication();
    applyAppConfiguration(degradedApp);
    await degradedApp.init();

    await request(degradedApp.getHttpServer())
      .get('/api/health')
      .expect(503)
      .expect({ status: 'degraded', database: 'down' });

    await degradedApp.close();
  });
});
