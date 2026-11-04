import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  testDir: '.', testMatch: ['notch-reentry.spec.ts', 'touch-only.spec.ts'], timeout: 30000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', hasTouch: true, trace: 'retain-on-failure' },
  webServer: { cwd: fileURLToPath(new URL('../../', import.meta.url)), command: 'node tools/gaga/preview.mjs', url: 'http://127.0.0.1:4173', timeout: 30000 },
  reporter: [['list'], ['json', { outputFile: '.gaga/quiet-v4-focused.json' }]], outputDir: '.gaga/quiet-v4-focused-traces'
});
