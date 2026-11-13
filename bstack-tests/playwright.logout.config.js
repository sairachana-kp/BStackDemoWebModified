// Local run config for the PR #2 header/logout specs against the dev server on localhost:3000
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const config = {
  testDir: './tests',
  testMatch: '**/header_logout*.js',
  timeout: 60 * 1000,
  expect: { timeout: 5000 },
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: process.env.BSTACK_DEMO_BASE_URL || 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chrome',
      use: { browserName: 'chromium', channel: 'chrome' },
    },
  ],
};

module.exports = config;
