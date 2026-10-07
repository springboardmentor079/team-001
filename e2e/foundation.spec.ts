import { test, expect, Page } from '@playwright/test';
import { readdir, readFile, mkdir } from 'node:fs/promises';

const password = process.env.DEMO_PASSWORD || 'BuildTrackDemo2026!';
async function login(page: Page, email: string, pass = password) {
  await page.goto('/login');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(pass);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/workspace/);
}

test('protected route redirects to login and invalid credentials show a useful error', async ({
  page,
}) => {
  await page.goto('/workspace');
  await expect(page).toHaveURL(/login/);
  await page.getByLabel('Work email').fill('admin@buildtrack.local');
  await page.getByLabel('Password', { exact: true }).fill('WrongPassword2026!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Email or password is incorrect');
  await mkdir('tmp/ui', { recursive: true });
  await page.getByLabel('Password', { exact: true }).fill('');
  await page.screenshot({ path: 'tmp/ui/login-desktop.png', fullPage: true });
});
for (const alias of ['admin', 'manager', 'engineer', 'contractor', 'worker', 'client']) {
  test(`${alias}: real login, session restore, account data and logout`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await login(page, `${alias}@buildtrack.local`);
    await expect(page.getByRole('heading', { name: 'Recent account activity' })).toBeVisible();
    await expect(page.getByText('Signed in to BuildTrack').first()).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/workspace/);
    await expect(page.getByRole('heading', { name: 'Recent account activity' })).toBeVisible();
    if (alias === 'admin') {
      await page.screenshot({ path: 'tmp/ui/workspace-desktop.png', fullPage: true });
      await page.getByRole('link', { name: 'Team directory' }).click();
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.getByRole('row')).toHaveCount(7);
    } else {
      await expect(page.getByRole('link', { name: 'Team directory' })).toHaveCount(0);
      await page.goto('/users');
      await expect(page).toHaveURL(/workspace/);
    }
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/login/);
    await page.goto('/workspace');
    await expect(page).toHaveURL(/login/);
    expect(errors).toEqual([]);
  });
}
test('registration, profile persistence, reset delivery, reset login and password change', async ({
  page,
}) => {
  test.setTimeout(90000);
  const email = `browser-${Date.now()}@buildtrack.test`;
  await page.goto('/register');
  await page.getByLabel('Full name', { exact: true }).fill('Browser Workflow');
  await page.getByLabel('Company', { exact: true }).fill('Browser Construction');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Your account is ready');
  await login(page, email);
  await page.getByRole('link', { name: 'My profile', exact: true }).click();
  await page.getByLabel('Full name', { exact: true }).fill('Browser Updated');
  await page.getByLabel('Phone number').fill('+91 98765 43210');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toContainText('updated');
  await page.reload();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Browser Updated');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/forgot-password');
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.getByLabel('Work email').fill(email);
  const resetResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/auth/forgot-password') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Send reset link' }).click();
  expect((await resetResponse).status()).toBe(202);
  let link = '';
  for (const file of await readdir('backend/.local/mail')) {
    const mail = JSON.parse(await readFile(`backend/.local/mail/${file}`, 'utf8')) as {
      to: string;
      text: string;
    };
    if (mail.to === email) link = mail.text.match(/http[^\s]+/)?.[0] || '';
  }
  expect(link).toContain('/reset-password?token=');
  await page.goto(link);
  await page.getByLabel('New password', { exact: true }).fill('NewBrowserPassword2026!');
  await page.getByLabel('Confirm password', { exact: true }).fill('NewBrowserPassword2026!');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByRole('status')).toContainText('Password updated');
  await login(page, email, 'NewBrowserPassword2026!');
  await page.getByRole('link', { name: 'Security', exact: true }).click();
  await page.getByLabel('Current password', { exact: true }).fill('NewBrowserPassword2026!');
  await page.getByLabel('New password', { exact: true }).fill(password);
  await page.getByLabel('Confirm new password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page).toHaveURL(/login/);
  await login(page, email);
});
test('mobile forms and navigation have no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await page.screenshot({ path: 'tmp/ui/login-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await login(page, 'manager@buildtrack.local');
  await expect(page.getByRole('heading', { name: 'Recent account activity' })).toBeVisible();
  await page.screenshot({ path: 'tmp/ui/workspace-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('link', { name: 'My profile', exact: true }).click();
  await expect(page).toHaveURL(/profile/);
  await expect(page.getByRole('button', { name: 'Close navigation' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Close navigation' })).toHaveCount(0);
});
