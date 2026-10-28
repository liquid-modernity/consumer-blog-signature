import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig(base, {
  testDir: './tools/reference/browser',
  timeout: 180000,
  projects: [320, 360, 390, 768, 1440].map(width => ({
    name: String(width),
    use: { browserName: 'chromium', viewport: { width, height: width === 1440 ? 1000 : 844 }, hasTouch: width < 1440, isMobile: width < 768, deviceScaleFactor: 1 },
  })),
  outputDir: '.gaga/reference-quality/test-results',
  reporter: [['list'], ['json', { outputFile: '.gaga/reference-quality/browser-results.json' }]],
});
