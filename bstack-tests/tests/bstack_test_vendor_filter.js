const { expect, test } = require('@playwright/test');

const BASE_URL = process.env.BSTACK_DEMO_URL || 'http://localhost:3000';

// Apple models shown when the Apple vendor filter is applied (observed on the live catalog)
const APPLE_PRODUCTS = [
  'iPhone 12',
  'iPhone 12 Mini',
  'iPhone 12 Pro Max',
  'iPhone 12 Pro',
  'iPhone 11',
  'iPhone 11 Pro',
  'iPhone XS',
  'iPhone XR',
  'iPhone XS Max',
];

test('Verify single vendor filter selection persists after navigating to cart and returning to catalog TC-205', async ({ page }) => {
  // Step 1: Navigate to the homepage; all 25 products displayed
  await page.goto(BASE_URL);
  await expect(page.getByRole('heading', { name: '25 Product(s) found.' })).toBeVisible();

  // Step 2: Select the Apple vendor checkbox; catalog filters to 9 Apple products
  const appleCheckbox = page.getByRole('checkbox', { name: 'Apple', exact: true });
  await page.getByText('Apple', { exact: true }).click();
  await expect(appleCheckbox).toBeChecked();
  await expect(page.getByRole('heading', { name: '9 Product(s) found.' })).toBeVisible();

  // Step 3: Add an Apple product to the cart; cart sidebar opens with the product
  await page.getByText('Add to cart', { exact: true }).first().click();
  await expect(page.locator('div.float-cart.float-cart--open')).toBeVisible();
  await expect(page.locator('div.float-cart.float-cart--open').getByText('iPhone 12', { exact: true })).toBeVisible();

  // Step 4: Close the cart sidebar to return to the catalog.
  // The app renders 'Continue Shopping' only for an EMPTY cart (FloatChart/index.jsx),
  // so with an item in the cart the sidebar 'X' close control is the real way back (TC-205 updated to match).
  await page.getByText('X', { exact: true }).click();
  await expect(page.locator('div.float-cart.float-cart--open')).toHaveCount(0);

  // Step 5: Apple checkbox is still selected
  await expect(appleCheckbox).toBeChecked();
  for (const vendor of ['Samsung', 'Google', 'OnePlus']) {
    await expect(page.getByRole('checkbox', { name: vendor, exact: true })).not.toBeChecked();
  }

  // Step 6: Only the 9 Apple products are still displayed
  await expect(page.getByRole('heading', { name: '9 Product(s) found.' })).toBeVisible();
  for (const name of APPLE_PRODUCTS) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
});
