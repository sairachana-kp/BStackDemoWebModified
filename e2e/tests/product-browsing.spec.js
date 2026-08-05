// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Product Browsing & Filtering Tests for bstackdemo.com
 *
 * Selectors grounded from live exploration:
 *  - Filter section:  .filters-available-size label  (contains input[value="Brand"])
 *  - Product items:   .shelf-item
 *  - Product count:   .shelf-container-header h3
 *  - Sort select:     select  (inside .shelf-container-header)
 *
 * The filter checkboxes are occluded by a <span class="checkmark"> overlay,
 * so we click the parent <label> via page.evaluate() to bypass the overlay.
 */

/** Helper: click a brand filter label by brand name */
async function clickBrandFilter(page, brand) {
  await page.evaluate((brandName) => {
    const labels = document.querySelectorAll('.filters-available-size label');
    const label = Array.from(labels).find(
      (l) => l.querySelector(`input[value="${brandName}"]`)
    );
    if (label) label.click();
  }, brand);
  // Wait for the product grid to update
  await page.waitForTimeout(500);
}

/** Helper: get all visible product names */
async function getProductNames(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.shelf-item p')).map((p) =>
      p.textContent.trim()
    )
  );
}

/** Helper: get product count text from the header */
async function getProductCountText(page) {
  return page.evaluate(() => {
    const h3 = document.querySelector('.shelf-container-header h3');
    return h3 ? h3.textContent.trim() : '';
  });
}

/** Helper: get prices as numbers (parsed from product cards) */
async function getProductPrices(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.shelf-item')).map((item) => {
      const priceEl = item.querySelector('.val b');
      return priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : 0;
    })
  );
}

test.describe('Product Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for products to load
    await page.waitForSelector('.shelf-item', { timeout: 15000 });
  });

  test('TC-01: displays 25 products on initial load', async ({ page }) => {
    const countText = await getProductCountText(page);
    expect(countText).toBe('25 Product(s) found.');

    const items = await page.locator('.shelf-item').count();
    expect(items).toBe(25);
  });

  test('TC-02: product cards show name, price, and Add to cart', async ({ page }) => {
    const firstItem = page.locator('.shelf-item').first();
    // Name
    await expect(firstItem.locator('p')).toBeVisible();
    // Price area
    await expect(firstItem.locator('.val')).toBeVisible();
    // Add to cart text
    await expect(firstItem).toContainText('Add to cart');
  });

  test('TC-03: filter section shows four brand checkboxes', async ({ page }) => {
    const brands = ['Apple', 'Samsung', 'Google', 'OnePlus'];
    for (const brand of brands) {
      await expect(
        page.locator(`.filters-available-size input[value="${brand}"]`)
      ).toBeAttached();
    }
  });
});

test.describe('Brand Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.shelf-item', { timeout: 15000 });
  });

  test('TC-04: Apple filter shows 9 iPhone products', async ({ page }) => {
    await clickBrandFilter(page, 'Apple');

    const countText = await getProductCountText(page);
    expect(countText).toBe('9 Product(s) found.');

    const names = await getProductNames(page);
    expect(names).toHaveLength(9);
    for (const name of names) {
      expect(name).toMatch(/iPhone/i);
    }
  });

  test('TC-05: Samsung filter shows only Galaxy products', async ({ page }) => {
    await clickBrandFilter(page, 'Samsung');

    const names = await getProductNames(page);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toMatch(/Galaxy/i);
    }

    const countText = await getProductCountText(page);
    expect(countText).toContain('Product(s) found.');
  });

  test('TC-06: Google filter shows only Pixel products', async ({ page }) => {
    await clickBrandFilter(page, 'Google');

    const names = await getProductNames(page);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toMatch(/Pixel/i);
    }
  });

  test('TC-07: OnePlus filter shows only OnePlus products', async ({ page }) => {
    await clickBrandFilter(page, 'OnePlus');

    const names = await getProductNames(page);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toMatch(/One Plus/i);
    }
  });

  test('TC-08: combining Apple and Samsung filters shows both brands', async ({ page }) => {
    await clickBrandFilter(page, 'Apple');
    await clickBrandFilter(page, 'Samsung');

    const names = await getProductNames(page);
    expect(names.length).toBeGreaterThan(9); // more than Apple alone

    const hasApple = names.some((n) => /iPhone/i.test(n));
    const hasSamsung = names.some((n) => /Galaxy/i.test(n));
    expect(hasApple).toBe(true);
    expect(hasSamsung).toBe(true);
  });

  test('TC-09: unchecking a filter restores all products', async ({ page }) => {
    // Apply Apple filter
    await clickBrandFilter(page, 'Apple');
    let countText = await getProductCountText(page);
    expect(countText).toBe('9 Product(s) found.');

    // Remove Apple filter
    await clickBrandFilter(page, 'Apple');
    countText = await getProductCountText(page);
    expect(countText).toBe('25 Product(s) found.');
  });
});

test.describe('Product Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.shelf-item', { timeout: 15000 });
  });

  test('TC-10: sort Lowest to Highest orders products by ascending price', async ({ page }) => {
    await page.locator('select').selectOption('Lowest to highest');
    await page.waitForTimeout(500);

    const prices = await getProductPrices(page);
    expect(prices.length).toBeGreaterThan(0);

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('TC-11: sort Highest to Lowest orders products by descending price', async ({ page }) => {
    await page.locator('select').selectOption('Highest to lowest');
    await page.waitForTimeout(500);

    const prices = await getProductPrices(page);
    expect(prices.length).toBeGreaterThan(0);

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  test('TC-12: sort works correctly after applying a brand filter', async ({ page }) => {
    // Filter to Apple first
    await clickBrandFilter(page, 'Apple');
    await page.waitForTimeout(300);

    // Then sort lowest to highest
    await page.locator('select').selectOption('Lowest to highest');
    await page.waitForTimeout(500);

    const prices = await getProductPrices(page);
    expect(prices.length).toBe(9);

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });
});