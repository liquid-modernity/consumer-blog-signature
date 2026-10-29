import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { chromium, devices } from '@playwright/test';
import { verifyBrowserSource } from './browser-source-readback.mjs';
const origin = 'https://consumer-blog-signature.ratriatra.workers.dev/';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedRecoveredSha256 = process.argv[2];
assert.match(expectedRecoveredSha256 ?? '', /^[a-f0-9]{64}$/);
const current = readFileSync('dist/index.html');
const previousResponse = await fetch(origin, { signal: AbortSignal.timeout(25000) });
assert.equal(previousResponse.status, 200);
const previous = Buffer.from(await previousResponse.arrayBuffer());
assert.equal(digest(previous), expectedRecoveredSha256, 'Unexpected production bytes after rollback');
assert.notEqual(digest(current), expectedRecoveredSha256);
const result = { source: process.env.GITHUB_SHA, node: process.version, currentRootSha256: digest(current), recoveredRootSha256: expectedRecoveredSha256, reproduction: [], recoveredBrowser: [], rejectsUnreleasedSource: [] };
// Route only inside isolated Chromium contexts: no production mutation or cache purge.
function routed(mode) {
  return { devices, chromium: { launch: async () => {
    const browser = await chromium.launch();
    return { close: () => browser.close(), newContext: async options => {
      const context = await browser.newContext(options);
      let index = 0;
      await context.route('**/*', route => {
        if (route.request().url() !== origin || !route.request().isNavigationRequest()) return route.abort();
        const old = mode === 'persistent' || index === 0 || index === 2;
        index++;
        return route.fulfill({ status: 200, contentType: 'text/html', headers: { 'cache-control': 'public, max-age=0, must-revalidate', 'cf-cache-status': 'HIT' }, body: old ? previous : current });
      });
      return context;
    } };
  } } };
}
for (const mode of ['persistent', 'settled']) {
  const checks = [];
  if (mode === 'persistent') await assert.rejects(verifyBrowserSource(routed(mode), digest(current), checks, async () => {}), /differs from admitted root/);
  else await verifyBrowserSource(routed(mode), digest(current), checks, async () => {});
  result.reproduction.push({ mode, nodeSha256: digest(current), decision: mode === 'persistent' ? 'DENIED' : 'ALLOWED_AFTER_SETTLED_MATCHES', checks });
}
await verifyBrowserSource({ chromium, devices }, expectedRecoveredSha256, result.recoveredBrowser);
await assert.rejects(verifyBrowserSource({ chromium, devices }, digest(current), result.rejectsUnreleasedSource, async () => {}), /differs from admitted root/);
result.status = 'PASS';
result.productionMutations = 0;
console.log(JSON.stringify(result, null, 2));
