import { expect, test } from '@playwright/test';

function uniqueEmail(label: string): string {
  return `user-${label}-${Date.now()}@example.com`;
}

const validPassword = 'Secret1!';

test.describe('Auth flows (Playwright)', () => {
  test('registers, reloads session, and logs out', async ({ page }) => {
    const email = uniqueEmail('register');

    await page.goto('/sign-up');
    await page.getByLabel('Name').fill('E2E User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(validPassword);
    await page.getByRole('button', { name: 'Sign up' }).click();

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

    const tokenAfterLogout = await page.evaluate(() =>
      sessionStorage.getItem('auth.accessToken'),
    );
    expect(tokenAfterLogout).toBeNull();
  });

  test('shows safe API error on failed sign-in', async ({ page }) => {
    const email = uniqueEmail('fail');

    await page.goto('/sign-up');
    await page.getByLabel('Name').fill('E2E User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(validPassword);
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(
      page.getByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('WrongPass1!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
    await expect(page.locator('body')).not.toContainText('simulated');
    await expect(page.locator('body')).not.toContainText('stack');
  });

  test('redirects to sign-in when session token is invalid', async ({ page }) => {
    await page.goto('/sign-in');
    await page.evaluate(() => {
      sessionStorage.setItem('auth.accessToken', 'invalid.jwt.token');
    });
    await page.goto('/app');

    await expect(
      page.getByRole('heading', { name: 'Sign in to your account' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Welcome to the application.' }),
    ).not.toBeVisible();
  });
});
