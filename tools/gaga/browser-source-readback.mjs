import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// A Node fetch can reach current assets while browser navigation still reaches an old edge response.
export async function verifyBrowserSource({ chromium, devices }, expectedSha256, checks, wait = () => new Promise(resolve => setTimeout(resolve, 2000))) {
  const origin = 'https://consumer-blog-signature.ratriatra.workers.dev';
  assert.match(expectedSha256, /^[a-f0-9]{64}$/, 'Missing admitted root identity');
  const browser = await chromium.launch();
  try {
    for (const [project, device] of [['desktop', 'Desktop Chrome'], ['mobile', 'iPhone 13']]) {
      const context = await browser.newContext(devices[device]);
      try {
        const page = await context.newPage();
        let consecutive = 0;
        for (let attempt = 0; attempt < 6; attempt++) {
          const response = await page.goto(origin + '/', { waitUntil: 'domcontentloaded', timeout: 25000 });
          assert.ok(response && response.url() === origin + '/', 'Unexpected browser root response');
          const sha256 = createHash('sha256').update(await response.body()).digest('hex');
          const headers = response.headers();
          const status = response.status();
          checks.push({ project, attempt, status, sha256, cacheStatus: headers['cf-cache-status'] ?? null, edge: headers['cf-ray'] ?? null, responseDate: headers.date ?? null });
          assert.ok([200, 404, 503].includes(status), 'Unexpected browser root status: ' + status);
          consecutive = status === 200 && sha256 === expectedSha256 ? consecutive + 1 : 0;
          if (consecutive === 2) break;
          if (attempt < 5) await wait();
        }
        assert.equal(consecutive, 2, 'Browser navigation differs from admitted root after bounded propagation checks: ' + project);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
