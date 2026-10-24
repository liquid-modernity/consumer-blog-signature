import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tools/gaga/browser",
  timeout: 30000,
  retries: 0,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: {
    command: "node tools/gaga/preview.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 30000,
  },
  reporter: [["list"], ["json", { outputFile: ".gaga/browser-results.json" }]],
});
