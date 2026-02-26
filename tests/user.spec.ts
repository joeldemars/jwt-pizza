import { test, expect } from 'playwright-test-coverage';
import { basicInit, loginAsDiner } from './util';

test('updateUser', async ({ page }) => {
  await loginAsDiner(page);

  await page.getByRole('link', { name: 'KC' }).click();

  await expect(page.getByRole('main')).toContainText('Kai Chen');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');

  const apiCall = page.waitForRequest(
    (req) => req.url().includes("/api/user/3") && req.method() == "PUT"
  );

  await page.getByRole('button', { name: 'Update' }).click();

  await apiCall;

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});