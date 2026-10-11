import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
test('local Effect greeting works without a backend or model', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByText('Local Effect demo · backend not connected')).toBeVisible();
  await screen.getByLabel('Your name').fill('Ada');
  await screen.getByRole('button', { name: 'Say hello' }).click();
  await expect(screen.getByRole('status')).toHaveText('Hello, Ada!');
  await screen.getByLabel('Your name').fill('  ');
  await screen.getByRole('button', { name: 'Say hello' }).click();
  await expect(screen.getByRole('status')).toHaveText('Hello, friend!');
  await app.screenshot('local-effect-greeting');
});
