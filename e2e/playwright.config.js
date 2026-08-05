// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const storageStatePath = process.env.STORAGE_STATE_PATH;
const baseURL = process.env.BASE_URL || 'https://www.bstackdemo.com';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL,
    ...(storageStatePath ? { storageState: storageStatePath } : {}),
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});