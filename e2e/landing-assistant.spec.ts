import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const password = process.env.DEMO_PASSWORD || 'BuildTrackDemo2026!';

test('landing page presents the platform and public assistant', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /From groundbreak to handover/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Create your workspace/ })).toBeVisible();
  await page.getByRole('button', { name: 'Open BuildTrack assistant' }).click();
  await page.getByRole('button', { name: 'What can BuildTrack do?' }).click();
  await expect(page.getByText(/connects project schedules/)).toBeVisible();
  await mkdir('tmp/ui', { recursive: true });
  await page.getByRole('button', { name: 'Close assistant' }).click();
  await page.screenshot({ path: 'tmp/ui/landing-desktop.png', fullPage: true });
});

test('authenticated assistant uses authorized workspace context', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Work email').fill('admin@buildtrack.local');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/workspace/);
  await page.getByRole('button', { name: 'Open BuildTrack assistant' }).click();
  await page.getByRole('button', { name: 'Summarize my workspace' }).click();
  await expect(page.getByText(/You can access \d+ projects?/)).toBeVisible();
  await expect(page.getByText(/Chat is not stored/)).toBeVisible();
});
