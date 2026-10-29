import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { EMAIL_SERVICE } from '../../src/email/email.service.interface.js';
import type { EmailService } from '../../src/email/email.service.interface.js';

export function applyAuthE2eEnv(): void {
  process.env.JWT_SECRET = 'test-jwt-secret-for-e2e';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  process.env.SMTP_HOST = '';
  process.env.COOKIE_SECURE = 'false';
}

export function getEmailService(app: INestApplication): EmailService {
  return app.get<EmailService>(EMAIL_SERVICE);
}

export function resetCapturedEmails(app: INestApplication): void {
  getEmailService(app).clearCapturedVerificationEmails();
}

export function extractVerificationToken(verifyUrl: string): string {
  const url = new URL(verifyUrl);
  const token = url.searchParams.get('token');
  if (!token) {
    throw new Error(`Missing token in verify URL: ${verifyUrl}`);
  }
  return token;
}

export type RegisteredUser = {
  email: string;
  name: string;
  password: string;
};

export async function registerUser(
  app: INestApplication<App>,
  body: RegisteredUser,
): Promise<void> {
  await request(app.getHttpServer())
    .post('/api/auth/sign-up')
    .send(body)
    .expect(201);
}

export async function verifyLatestEmailFor(
  app: INestApplication<App>,
  email: string,
): Promise<{ accessToken: string }> {
  const captured = getEmailService(app).getCapturedVerificationEmails();
  const entry = captured.find((item) => item.to === email.toLowerCase());
  if (!entry) {
    throw new Error(`No verification email captured for ${email}`);
  }
  const token = extractVerificationToken(entry.verifyUrl);
  const response = await request(app.getHttpServer())
    .post('/api/auth/verify-email')
    .send({ token })
    .expect(200);

  return { accessToken: response.body.accessToken as string };
}

export async function registerAndVerifyUser(
  app: INestApplication<App>,
  body: RegisteredUser,
): Promise<{ accessToken: string }> {
  await registerUser(app, body);
  return verifyLatestEmailFor(app, body.email);
}

export async function signInVerifiedUser(
  app: INestApplication<App>,
  email: string,
  password: string,
): Promise<{ accessToken: string; cookies: string[] }> {
  const agent = request.agent(app.getHttpServer());
  const response = await agent
    .post('/api/auth/sign-in')
    .send({ email, password })
    .expect(200);

  const cookies = (response.headers['set-cookie'] ?? []) as string[];
  return {
    accessToken: response.body.accessToken as string,
    cookies,
  };
}
