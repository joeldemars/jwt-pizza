import { test, expect } from 'playwright-test-coverage';

test('new example test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.getByText('JWT Pizza', { exact: true })).toBeVisible();
})
