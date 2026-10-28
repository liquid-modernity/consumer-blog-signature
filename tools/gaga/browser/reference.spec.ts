import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const article = '/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity';
const savedKey = 'gaga:saved:v1';
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});

test('reference Site surfaces and machine discovery retain the admitted public record set', async ({ page }) => {
  const indexResponse = await page.request.get('/search-index.json'); expect(indexResponse.status()).toBe(200);
  const index = await indexResponse.json();
  const admitted = JSON.parse(readFileSync('content/emdash/published.json', 'utf8'));
  for (const doc of admitted.documents) expect(index.artifacts.some((a: { id: string }) => a.id === admitted.origin + '/_emdash/api/content/' + doc.pin.collection + '/' + doc.pin.id)).toBe(true);
  for (const path of ['/publications', '/knowledge', '/knowledge/index', '/topics', '/tags', '/archive/2026']) {
    const response = await page.goto(path); expect(response?.status(), path).toBe(200);
    await expect(page.locator('main').first()).toBeVisible();
  }
  for (const path of ['/machine.json', '/agent.json', '/sitemap.xml', '/sitemap-index.xml', '/rss.xml', '/robots.txt', '/llms.txt']) {
    const response = await page.request.get(path); expect(response.status(), path).toBe(200); expect((await response.body()).length).toBeGreaterThan(0);
  }
});

test('reference Experience saves the visible article, survives reload, lists and removes it', async ({ page }, info) => {
  await page.goto(article); await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime', 'ready');
  const frame = page.locator('[data-gaga-app-frame]'), id = await frame.getAttribute('data-gaga-page-id'); expect(id).toBeTruthy();
  const save = page.locator('[data-gaga-action="save-reading"][data-gaga-quick-action="save"]');
  await expect(save).toBeVisible(); await save.click();
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '[]').map((x: { id: string }) => x.id), savedKey)).toContain(id);
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  const persisted = await page.evaluate(key => localStorage.getItem(key), savedKey);
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime', 'ready');
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(key => localStorage.getItem(key), savedKey)).toBe(persisted);
  await page.goto('/saved'); await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime', 'ready');
  const item = page.locator('[data-gaga-saved-bookmarks-list] .gaga-saved-item').filter({ has: page.locator('a[href="' + article + '"]') });
  await expect(item).toHaveCount(1); await expect(item).toContainText('Akal Imitasi');
  mkdirSync('.gaga/reference', { recursive: true });
  await page.screenshot({ path: '.gaga/reference/' + info.project.name + '-saved.png', fullPage: true });
  await item.locator('[data-gaga-saved-remove]').click();
  await expect(item).toHaveCount(0);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '[]').length, savedKey)).toBe(0);
  await page.goto(article); await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime', 'ready');
  await expect(save).toHaveAttribute('aria-pressed', 'false');
});

test('independent Experience consumer uses the published selector and storage ports', async ({ page }, info) => {
  const bundle = await build({ entryPoints: ['tools/reference/independent-reader.ts'], bundle: true, platform: 'browser', format: 'iife', write: false });
  await page.goto('about:blank');
  await page.setContent('<main><button data-field-save>Save field note</button><button data-field-cleanup>Stop</button><output data-field-state>[]</output></main>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const save = page.locator('[data-field-save]'), state = page.locator('[data-field-state]');
  await expect(save).toHaveAttribute('aria-pressed', 'false'); await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'true'); await expect(state).toContainText('field:moss');
  await save.click(); await expect(state).toHaveText('[]'); await expect(save).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-field-cleanup]').click(); await save.click();
  await expect(state).toHaveText('[]'); await expect(save).toHaveAttribute('aria-pressed', 'false');
  mkdirSync('.gaga/reference', { recursive: true });
  writeFileSync('.gaga/reference/' + info.project.name + '-independent.json', JSON.stringify({ status: 'PASS', entry: '@gaga/engine-runtime/runtime/saved-reading', version: '0.4.0', independentSelector: true, independentStorage: true, cleanupVerified: true }) + '\n');
});
