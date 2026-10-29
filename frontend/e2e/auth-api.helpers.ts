import { expect, test, type APIRequestContext, type BrowserContext } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:3000/api';

export function uniqueEmail(label: string): string {
  return `user-${label}-${Date.now()}@example.com`;
}

export const validPassword = 'Secret1!';

export async function registerAndVerifyViaApi(
  request: APIRequestContext,
  input: { email: string; name: string; password: string },
): Promise<{ accessToken: string; setCookie: string[] }> {
  const signUpResponse = await request.post(`${apiBaseUrl}/auth/sign-up`, {
    data: input,
  });
  expect(signUpResponse.ok()).toBeTruthy();
  const signUpBody = (await signUpResponse.json()) as {
    verificationToken?: string;
  };
  if (!signUpBody.verificationToken) {
    throw new Error('verificationToken missing — is EXPOSE_VERIFICATION_TOKEN enabled?');
  }

  const verifyResponse = await request.post(`${apiBaseUrl}/auth/verify-email`, {
    data: { token: signUpBody.verificationToken },
  });
  expect(verifyResponse.ok()).toBeTruthy();
  const verifyBody = (await verifyResponse.json()) as { accessToken: string };
  const setCookie = verifyResponse.headers()['set-cookie'] ?? [];

  return { accessToken: verifyBody.accessToken, setCookie };
}

export async function applyRefreshCookies(
  context: BrowserContext,
  setCookieHeaders: string | string[],
): Promise<void> {
  const headers = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : [setCookieHeaders];
  const cookies = headers.map((header) => {
    const [nameValue] = header.split(';');
    const [name, value] = nameValue!.split('=');
    return {
      name: name!.trim(),
      value: value!.trim(),
      domain: '127.0.0.1',
      path: '/api/auth',
    };
  });
  await context.addCookies(cookies);
}
