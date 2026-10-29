import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
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
import { USERS_REPOSITORY } from '../src/users/repositories/users.repository.js';
import { User, type UserDocument } from '../src/users/schemas/user.schema.js';
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from './helpers/mongo-memory.js';
import { applyAppConfiguration } from './helpers/nest-app.js';

describe('Auth integration (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: typeof import('../src/app.module.js').AppModule;
  let userModel: Model<UserDocument>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-e2e';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.THROTTLE_LIMIT = '1000';
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
    userModel = app.get(getModelToken(User.name));
  });

  afterEach(async () => {
    await app?.close();
  });

  const validSignUpBody = {
    email: 'integration-user@example.com',
    name: 'Integration User',
    password: 'Secret1!',
  };

  it('rejects sign-up when password has no letter', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ ...validSignUpBody, password: '12345678!' })
      .expect(400);
  });

  it('rejects sign-up when email is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ name: validSignUpBody.name, password: validSignUpBody.password })
      .expect(400);
  });

  it('rejects sign-up when name is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({
        email: validSignUpBody.email,
        password: validSignUpBody.password,
      })
      .expect(400);
  });

  it('rejects sign-up when password is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ email: validSignUpBody.email, name: validSignUpBody.name })
      .expect(400);
  });

  it('returns 409 for case-insensitive duplicate email', async () => {
    const email = 'CaseDup@Example.com';

    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ ...validSignUpBody, email })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ ...validSignUpBody, email: email.toUpperCase() })
      .expect(409);
  });

  it('handles parallel duplicate sign-up with one success and one conflict', async () => {
    const email = `race-${Date.now()}@example.com`;
    const body = {
      email,
      name: 'Race User',
      password: 'Secret1!',
    };

    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post('/api/auth/sign-up').send(body),
      request(app.getHttpServer()).post('/api/auth/sign-up').send(body),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
  });

  it('stores bcrypt password hashes and verifies credentials on sign-in', async () => {
    const email = `bcrypt-${Date.now()}@example.com`;
    const password = 'Secret1!';

    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ email, name: 'Bcrypt User', password })
      .expect(201);

    const stored = await userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
    expect(stored?.passwordHash).toMatch(/^\$2/);

    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email, password: 'WrongPass1!' })
      .expect(401);

    const signInResponse = await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email, password })
      .expect(200);

    expect(signInResponse.body.user).not.toHaveProperty('passwordHash');
  });

  it('supports sign-up, me, sign-in, and me without exposing password hashes', async () => {
    const email = `chain-${Date.now()}@example.com`;
    const password = 'Secret1!';

    const signUpResponse = await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({ email, name: 'Chain User', password })
      .expect(201);

    expect(signUpResponse.body.user).not.toHaveProperty('passwordHash');
    const { accessToken } = signUpResponse.body;

    const meAfterSignUp = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(meAfterSignUp.body.user.email).toBe(email.toLowerCase());
    expect(meAfterSignUp.body.user).not.toHaveProperty('passwordHash');

    const signInResponse = await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({ email, password })
      .expect(200);

    expect(signInResponse.body.user).not.toHaveProperty('passwordHash');

    const meAfterSignIn = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signInResponse.body.accessToken}`)
      .expect(200);
    expect(meAfterSignIn.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns a safe 500 without stack trace when persistence fails', async () => {
    await app.close();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USERS_REPOSITORY)
      .useValue({
        create: async () => {
          throw new Error('simulated database failure');
        },
        findByEmail: async () => null,
        findByEmailWithPasswordHash: async () => null,
        findById: async () => null,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    applyAppConfiguration(app);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({
        email: 'fail@example.com',
        name: 'Fail User',
        password: 'Secret1!',
      })
      .expect(500);

    expect(response.body.message).toBe('Unable to complete registration');
    expect(response.body).not.toHaveProperty('stack');
  });

  it('does not include stack traces in 500 responses when NODE_ENV is production', async () => {
    await app.close();
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USERS_REPOSITORY)
      .useValue({
        create: async () => {
          throw new Error('simulated database failure');
        },
        findByEmail: async () => null,
        findByEmailWithPasswordHash: async () => null,
        findById: async () => null,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    applyAppConfiguration(app);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({
        email: 'prod-fail@example.com',
        name: 'Prod Fail',
        password: 'Secret1!',
      })
      .expect(500);

    expect(response.body).not.toHaveProperty('stack');
    expect(JSON.stringify(response.body)).not.toMatch(
      /simulated database failure/,
    );

    process.env.NODE_ENV = previousNodeEnv;
  });
});
