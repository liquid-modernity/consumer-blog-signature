import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tools/editorial/browser",
  timeout: 180000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:4322",
    headless: true,
    trace: "off",
    viewport: { width: 1600, height: 1100 },
    ...(process.env.GAGA_STUDIO_BROWSER_EXECUTABLE
      ? {
          launchOptions: {
            executablePath: process.env.GAGA_STUDIO_BROWSER_EXECUTABLE,
          },
        }
      : {}),
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
