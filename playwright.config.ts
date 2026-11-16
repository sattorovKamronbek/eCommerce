import { defineConfig, devices } from "@playwright/test";
const baseURL = "http://127.0.0.1:3000";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: "list",
  outputDir: "/tmp/oro-playwright-results",
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1",
    url: baseURL,
    // The trusted callback origin must match the browser's cookie host.
    // This changes only the test server, never the owner's .env.local.
    env: { APP_ORIGIN: baseURL },
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 834, height: 1112 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
});
