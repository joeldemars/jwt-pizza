import { test, expect } from 'playwright-test-coverage';
import { Page } from '@playwright/test';
import { basicInit, loginAsAdmin, loginAsDiner, loginAsFranchisee } from './util';

test('login', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test('404', async ({ page }) => {
  await basicInit(page);

  await page.goto('/gimme-pizza');

  await expect(page.getByRole('heading')).toContainText('Oops');
  await expect(page.getByRole('main')).toContainText('It looks like we have dropped a pizza on the floor. Please try another page.');
});

test('register', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'Register' }).click();

  await page.getByRole('textbox', { name: 'Full name' }).fill('John');
  await page.getByRole('textbox', { name: 'Email address' }).fill('john@pizza.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('pizzafan');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByRole('link', { name: 'J' })).toBeVisible();
});

test('logout', async ({ page }) => {
  await loginAsDiner(page);

  await page.getByRole('link', { name: 'Logout' }).click();

  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
});

test('about', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'About' }).click();

  await expect(page.getByRole('main')).toContainText('The secret sauce');
});

test('display franchise', async ({ page }) => {
  await loginAsAdmin(page);

  await expect(page.getByRole('table')).toContainText('LotaPizza');
  await expect(page.getByRole('table')).toContainText('Lehi');
  await expect(page.getByRole('table')).toContainText('Springville');
  await expect(page.getByRole('table')).toContainText('American Fork');
});

test('add franchise', async ({ page }) => {
  await loginAsAdmin(page);

  await page.getByRole('button', { name: 'Add Franchise' }).click();

  await expect(page.getByRole('heading')).toContainText('Create franchise');

  await page.getByRole('textbox', { name: 'franchise name' }).fill('New franchise');
  await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('a@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.locator('h2')).toContainText('Mama Ricci\'s kitchen');
});

test('close franchise', async ({ page }) => {
  await loginAsAdmin(page);

  await page.getByRole('row', { name: 'LotaPizza' }).getByRole('button').click();

  await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the');
  await expect(page.getByRole('main')).toContainText('franchise?');

  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page.locator('h2')).toContainText('Mama Ricci\'s kitchen');
});

test('create store', async ({ page }) => {
  await loginAsFranchisee(page);

  await page.goto('/franchise-dashboard', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading')).toContainText('pizzaPocket');
  await expect(page.getByRole('table')).toContainText('SLC');

  await page.getByRole('button', { name: 'Create store' }).click();

  await expect(page.getByRole('heading')).toContainText('Create store');

  await page.getByRole('textbox', { name: 'store name' }).fill('New store');
  const apiCall = page.waitForResponse('*/**/api/franchise/*');
  await page.getByRole('button', { name: 'Create' }).click();
  await apiCall;

  await expect(page.getByRole('heading')).toContainText('pizzaPocket');
});

test('diner dashboard', async ({ page }) => {
  await loginAsDiner(page);

  await page.goto('/diner-dashboard', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading')).toContainText('Your pizza kitchen');
  await expect(page.locator('tbody')).toContainText('1');
  await expect(page.locator('tbody')).toContainText('0.05 ₿');
  await expect(page.locator('tbody')).toContainText('2024-06-05T05:14:40.000Z');
});
