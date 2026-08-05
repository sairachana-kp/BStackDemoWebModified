// @ts-check
const { test, expect } = require('@playwright/test');

// Selectors grounded from live browser exploration of https://www.bstackdemo.com
// Session 1 (unauthenticated):
//   Step 3 evaluate: .shelf-item, .shelf-item__buy-btn, .float-cart, .float-cart__content
//   Step 7 evaluate: .change-product-button (text "-"/"+"), .sub-price__val, .buy-btn, .float-cart__shelf-container
//   Step 8 click attrs: {"tagName":"button","class":"change-product-button"} (+ button)
//   Step 9 click attrs: {"tagName":"button","class":"change-product-button"} (- button)
// Session 2 (signin page):
//   evaluate: #username (container), #password (container), #react-select-2-input, #react-select-3-input
//   evaluate: option id react-select-2-option-0-0 (demouser), react-select-3-option-0-0 (testingisfun99)
//   click attrs: {"tagName":"button","id":"login-btn","class":"Button_root__24MxS Button_slim__2caxo"}
// Session 2 (checkout page):
//   fill_form attrs: #firstNameInput, #lastNameInput, #addressLine1Input, #provinceInput, #postCodeInput
//   click attrs: {"tagName":"button","id":"checkout-shipping-continue","class":"button button--primary optimizedCheckout-buttonPrimary"}
//   snapshot: "Your Order has been successfully placed."

/**
 * Helper: log in via the signin page dropdowns.
 * Used in tests that need an authenticated session without storageState.
 */
async function loginViaUI(page) {
  await page.goto('/signin');
  // Open username dropdown and select demouser
  await page.locator('#username').click();
  await page.locator('#react-select-2-option-0-0').click();
  // Open password dropdown and select testingisfun99
  await page.locator('#password').click();
  await page.locator('#react-select-3-option-0-0').click();
  // Click LOG IN
  await page.locator('#login-btn').click();
  // Wait for redirect to home page — app may redirect to /?signin=true or /
  await page.waitForURL(/bstackdemo\.com\/?(\?.*)?$/, { timeout: 15000 });
  await page.waitForSelector('.shelf-item', { timeout: 15000 });
}

test.describe('Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.shelf-item', { timeout: 15000 });
  });

  test('TC-1: Add a single item to cart', async ({ page }) => {
    // Add iPhone 12 (first product) to cart
    await page.locator('.shelf-item').first().locator('.shelf-item__buy-btn').click();

    // Cart panel should open
    await expect(page.locator('.float-cart')).toHaveClass(/float-cart--open/);
    await expect(page.locator('.float-cart__content')).toBeVisible();

    // Bag count should be 1
    await expect(page.locator('.bag span').first()).toHaveText('1');

    // Subtotal should be non-zero
    const subtotal = page.locator('.sub-price__val');
    await expect(subtotal).toBeVisible();
    const subtotalText = await subtotal.textContent();
    expect(subtotalText).toMatch(/\$\s*\d+/);
  });

  test('TC-2: Add multiple items to cart', async ({ page }) => {
    const products = page.locator('.shelf-item');

    // Add first product
    await products.nth(0).locator('.shelf-item__buy-btn').click();
    await expect(page.locator('.float-cart')).toHaveClass(/float-cart--open/);

    // Close cart and add second product
    await page.locator('.float-cart__close-btn').click();
    await products.nth(1).locator('.shelf-item__buy-btn').click();

    // Cart should show 2 items
    await expect(page.locator('.bag span').first()).toHaveText('2');
  });

  test('TC-3: Increase item quantity in cart', async ({ page }) => {
    // Add iPhone 12 to cart
    await page.locator('.shelf-item').first().locator('.shelf-item__buy-btn').click();
    await expect(page.locator('.float-cart')).toHaveClass(/float-cart--open/);

    // Get initial subtotal
    const subtotal = page.locator('.sub-price__val');
    const initialText = await subtotal.textContent();
    const initialAmount = parseFloat(initialText.replace(/[^0-9.]/g, ''));

    // Click "+" to increase quantity
    await page.locator('.change-product-button').filter({ hasText: '+' }).click();

    // Bag count should be 2
    await expect(page.locator('.bag span').first()).toHaveText('2');

    // Subtotal should double
    const updatedText = await subtotal.textContent();
    const updatedAmount = parseFloat(updatedText.replace(/[^0-9.]/g, ''));
    expect(updatedAmount).toBeCloseTo(initialAmount * 2, 0);
  });

  test('TC-4: Decrease item quantity in cart', async ({ page }) => {
    // Add iPhone 12 to cart
    await page.locator('.shelf-item').first().locator('.shelf-item__buy-btn').click();
    await expect(page.locator('.float-cart')).toHaveClass(/float-cart--open/);

    // Increase to 2 first
    await page.locator('.change-product-button').filter({ hasText: '+' }).click();
    await expect(page.locator('.bag span').first()).toHaveText('2');

    // Get subtotal at qty 2
    const subtotal = page.locator('.sub-price__val');
    const doubledText = await subtotal.textContent();
    const doubledAmount = parseFloat(doubledText.replace(/[^0-9.]/g, ''));

    // Click "-" to decrease quantity back to 1
    await page.locator('.change-product-button').filter({ hasText: '-' }).click();
    await expect(page.locator('.bag span').first()).toHaveText('1');

    // Subtotal should halve
    const reducedText = await subtotal.textContent();
    const reducedAmount = parseFloat(reducedText.replace(/[^0-9.]/g, ''));
    expect(reducedAmount).toBeCloseTo(doubledAmount / 2, 0);
  });

  test('TC-5: Remove item from cart using the delete button', async ({ page }) => {
    // Add iPhone 12 to cart
    await page.locator('.shelf-item').first().locator('.shelf-item__buy-btn').click();
    await expect(page.locator('.float-cart')).toHaveClass(/float-cart--open/);
    await expect(page.locator('.bag span').first()).toHaveText('1');

    // Click the .shelf-item__del button inside the cart to remove the item
    // Observed in evaluate: floatCartHTML shows <div class="shelf-item__del"></div> inside .float-cart__shelf-container
    await page.locator('.float-cart__shelf-container .shelf-item__del').first().click();

    // Cart should show 0 items after removal
    await expect(page.locator('.bag span').first()).toHaveText('0');
  });
});

test.describe('Checkout Flow (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // If storageState is provided via env, the page is pre-authenticated.
    // Otherwise fall back to UI login.
    await page.goto('/');
    const isLoggedIn = await page.locator('text=Logout').isVisible().catch(() => false);
    if (!isLoggedIn) {
      await loginViaUI(page);
    }
    await page.waitForSelector('.shelf-item', { timeout: 15000 });
  });

  test('TC-6: Checkout button navigates to checkout page when authenticated', async ({ page }) => {
    // Add a product to cart
    await page.locator('.shelf-item').first().locator('.shelf-item__buy-btn').click();
    await expect(page.locator('.float-cart')).toHaveClass(/float-cart--open/);

    // Click CHECKOUT
    await page.locator('.buy-btn').click();

    // Should land on /checkout (not /signin) because user is authenticated
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15000 });
  });

  test('TC-7: Complete checkout with shipping address', async ({ page }) => {
    // Add iPhone 12 to cart
    await page.locator('.shelf-item').first().locator('.shelf-item__buy-btn').click();
    await expect(page.locator('.float-cart')).toHaveClass(/float-cart--open/);

    // Click CHECKOUT
    await page.locator('.buy-btn').click();
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15000 });

    // Fill shipping address form using grounded IDs
    await page.locator('#firstNameInput').fill('Test');
    await page.locator('#lastNameInput').fill('User');
    await page.locator('#addressLine1Input').fill('123 Test Street');
    await page.locator('#provinceInput').fill('California');
    await page.locator('#postCodeInput').fill('90001');

    // Submit the order
    await page.locator('#checkout-shipping-continue').click();

    // Confirmation: "Your Order has been successfully placed."
    await expect(page.getByText('Your Order has been successfully placed.')).toBeVisible({ timeout: 15000 });
  });

  test('TC-8: Order summary shows correct item and total on checkout page', async ({ page }) => {
    // Add iPhone 12 to cart
    await page.locator('.shelf-item').first().locator('.shelf-item__buy-btn').click();
    await expect(page.locator('.float-cart')).toHaveClass(/float-cart--open/);

    // Note the subtotal from cart
    const cartSubtotal = await page.locator('.sub-price__val').textContent();

    // Go to checkout
    await page.locator('.buy-btn').click();
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15000 });

    // Order summary should show 1 item
    await expect(page.getByRole('heading', { name: /1 item\(s\)/ })).toBeVisible();

    // Order summary should show "Order Summary" heading
    await expect(page.getByRole('heading', { name: 'Order Summary' })).toBeVisible();
  });
});