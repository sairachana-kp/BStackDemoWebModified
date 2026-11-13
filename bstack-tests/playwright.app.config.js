// Runs the app-level specs against the locally running dev server (http://localhost:3000)
module.exports = {
  testDir: './tests',
  testMatch: '**/bstack_header*.js',
  timeout: 90 * 1000,
  expect: { timeout: 5000 },
  workers: 1,
  reporter: 'line',
  projects: [
    {
      name: 'chrome',
      use: { browserName: 'chromium', channel: 'chrome' },
    },
  ],
};
