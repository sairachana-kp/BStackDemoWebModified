// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Helper: select an option from a react-select dropdown by container id and option text.
 *
 * bstackdemo.com uses react-select which intercepts pointer events on the hidden <input>.
 * We dispatch mousedown on the placeholder div (class css-1wa3eu0-placeholder) to open the
 * menu, then click the matching option element by its text content.
 *
 * Observed in browsing session:
 *   - username container: div#username  (Step 5)
 *   - password container: div#password  (Step 5)
 *   - placeholder class: css-1wa3eu0-placeholder  (Step 7)
 *   - option ids: react-select-2-option-0-N (username), react-select-3-option-0-N (password)  (Step 9, 12)
 */
async function selectReactSelectOption(page, containerId, optionText) {
  // Open the dropdown by dispatching mousedown on the placeholder div
  await page.evaluate((id) => {
    const container = document.querySelector('#' + id);
    const placeholder = container && container.querySelector('.css-1wa3eu0-placeholder');
    if (placeholder) {
      placeholder.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }
  }, containerId);

  // Wait briefly for the menu to render, then click the option by text
  await page.evaluate((args) => {
    const { id, text } = args;
    const container = document.querySelector('#' + id);
    if (!container) return;
    const options = container.querySelectorAll('[id^="react-select"]');
    for (const opt of options) {
      if (opt.textContent.trim() === text) {
        opt.click();
        return;
      }
    }
  }, { id: containerId, text: optionText });
}

test.describe('Sign-in flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
    // login-btn observed at Step 14: page.locator('#login-btn')
    await expect(page.locator('#login-btn')).toBeVisible();
  });

  test('successful login with valid credentials (demouser)', async ({ page }) => {
    await selectReactSelectOption(page, 'username', 'demouser');
    await selectReactSelectOption(page, 'password', 'testingisfun99');

    // login-btn: id="login-btn" observed at Step 14
    await page.locator('#login-btn').click();

    // Post-login URL observed at Step 15: https://www.bstackdemo.com/?signin=true
    await expect(page).toHaveURL(/\?signin=true/);
    // Username shown in header — text "demouser" observed in post-login snapshot (Step 15)
    await expect(page.getByText('demouser')).toBeVisible();
    // Logout/signin link: id="signin" observed at Step 17
    await expect(page.locator('#signin')).toBeVisible();
  });

  test('login failure with invalid username (no username selected)', async ({ page }) => {
    // Only password selected; username left empty → API returns "Invalid Username"
    await selectReactSelectOption(page, 'password', 'testingisfun99');
    await page.locator('#login-btn').click();

    // Should stay on /signin
    await expect(page).toHaveURL('/signin');
    // Error element: class="api-error" observed at Step 24
    await expect(page.locator('.api-error')).toBeVisible();
    await expect(page.locator('.api-error')).toContainText('Invalid Username');
  });

  test('login failure with invalid password (no password selected)', async ({ page }) => {
    // Username selected but password left empty → API returns "Invalid Password"
    await selectReactSelectOption(page, 'username', 'demouser');
    await page.locator('#login-btn').click();

    // Should stay on /signin
    await expect(page).toHaveURL('/signin');
    // Error element: class="api-error" observed at Step 24
    await expect(page.locator('.api-error')).toBeVisible();
    await expect(page.locator('.api-error')).toContainText('Invalid Password');
  });

  test('locked_user cannot log in', async ({ page }) => {
    await selectReactSelectOption(page, 'username', 'locked_user');
    await selectReactSelectOption(page, 'password', 'testingisfun99');
    await page.locator('#login-btn').click();

    // Should stay on /signin
    await expect(page).toHaveURL('/signin');
    // Error element: class="api-error", text "Your account has been locked." observed at Step 24
    await expect(page.locator('.api-error')).toBeVisible();
    await expect(page.locator('.api-error')).toContainText('Your account has been locked.');
  });
});