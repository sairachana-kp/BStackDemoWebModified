// Local run config for the header login/logout specs (PR #2). App must be running on localhost:3000.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const config = {
  testDir: './tests',
  testMatch: '**/bstack_local_header*.js',
  timeout: 90 * 1000,
  expect: { timeout: 5000 },
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: process.env.APP_BASE_URL || 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chrome',
      use: { browserName: 'chromium', channel: 'chrome' },
    },
  ],
};

module.exports = config;
