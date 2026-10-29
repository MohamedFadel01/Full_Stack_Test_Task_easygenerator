import { expect, test } from '@playwright/test';
import {
  applyRefreshCookies,
  registerAndVerifyViaApi,
  uniqueEmail,
  validPassword,
} from './auth-api.helpers';

test.describe('Auth flows (Playwright)', () => {
  test('registers, reloads session, and logs out', async ({ page, request }) => {
    const email = uniqueEmail('register');
    const { setCookie } = await registerAndVerifyViaApi(request, {
      email,
      name: 'E2E User',
      password: validPassword,
    });

    await applyRefreshCookies(page.context(), setCookie);
    await page.goto('/app');

    await expect(
      page.getByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(
      page.getByRole('heading', { name: 'Sign in to your account' }),
    ).toBeVisible();
  });

  test('shows safe API error on failed sign-in', async ({ page, request }) => {
    const email = uniqueEmail('fail');
    await registerAndVerifyViaApi(request, {
      email,
      name: 'E2E User',
      password: validPassword,
    });

    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('WrongPass1!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
    await expect(page.locator('body')).not.toContainText('simulated');
    await expect(page.locator('body')).not.toContainText('stack');
  });

  test('redirects to sign-in when refresh session is unavailable', async ({
    page,
  }) => {
    await page.goto('/app');

    await expect(
      page.getByRole('heading', { name: 'Sign in to your account' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Welcome to the application.' }),
    ).not.toBeVisible();
  });

  test('sign-up shows check your email screen', async ({ page }) => {
    const email = uniqueEmail('check-email');

    await page.goto('/sign-up');
    await page.getByLabel('Name').fill('E2E User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(validPassword);
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(
      page.getByRole('heading', { name: 'Check your email' }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });
});
