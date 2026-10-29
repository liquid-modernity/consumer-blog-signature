import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { browserRequestAllowed, browserTarget } from './browser-contract.mjs';

// Fulfil or abort every request: this checks real Chromium routing without production network access.
const browser = await chromium.launch();
const observations = [];
try {
  for (const productionOrigin of [undefined, 'https://consumer-blog-signature.ratriatra.workers.dev']) {
    const target = browserTarget(productionOrigin), context = await browser.newContext();
    const accepted = [], denied = [];
    await context.route('**/*', route => {
      const url = route.request().url();
      if (browserRequestAllowed(url, productionOrigin)) {
        accepted.push(url); return route.fulfill({ status: 200, contentType: 'text/html', body: '<main>origin proof</main>' });
      }
      denied.push(url); return route.abort('blockedbyclient');
    });
    const page = await context.newPage();
    for (const origin of target.origins) assert.equal((await page.goto(origin + '/origin-proof')).status(), 200);
    const blocked = target.production
      ? ['http://127.0.0.1:4173', 'http://localhost:4173', 'https://consumer-blog-signature-cms.ratriatra.workers.dev', 'https://unexpected.invalid']
      : ['https://consumer-blog-signature.ratriatra.workers.dev', 'http://localhost:4321', 'https://unexpected.invalid'];
    for (const origin of blocked) await assert.rejects(() => page.goto(origin + '/origin-proof'), /ERR_BLOCKED_BY_CLIENT/);
    assert.equal(accepted.length, target.origins.length); assert.equal(denied.length, blocked.length);
    observations.push({ mode: target.production ? 'production' : 'local', accepted, denied, networkRequests: 0 });
    await context.close();
  }
  console.log(JSON.stringify({ status: 'PASS', observations }));
} finally { await browser.close(); }
