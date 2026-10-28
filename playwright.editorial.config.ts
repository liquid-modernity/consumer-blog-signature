import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tools/editorial/browser",
  timeout: 180000,
  // Cold native admin modules can take longer than the default five-second assertion window.
  expect: { timeout: 15000 },
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:4322",
    headless: process.env.GAGA_EDITORIAL_SCREEN_READER !== "orca",
    trace: "off",
    screenshot: "only-on-failure",
    viewport: { width: 1600, height: 1100 },
    launchOptions: {
      ...(process.env.GAGA_STUDIO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GAGA_STUDIO_BROWSER_EXECUTABLE }
        : {}),
      ...(process.env.GAGA_EDITORIAL_SCREEN_READER === "orca"
        ? { args: ["--force-renderer-accessibility"] }
        : {}),
    },
  },
  webServer: [
    {
      command: "npm run editorial:studio",
      url: "http://localhost:4322/",
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
      env: { ASTRO_DEV_BACKGROUND: "1" },
    },
    {
      command: "npm run dev -- --host 127.0.0.1",
      url: "http://localhost:3000/",
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
      env: { ASTRO_DEV_BACKGROUND: "1" },
    },
  ],
  reporter: [
    ["list"],
    ["json", { outputFile: ".gaga/editorial/browser-results.json" }],
  ],
});
