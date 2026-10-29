import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifyBrowserSource } from './browser-source-readback.mjs';
const digest = value => createHash('sha256').update(value).digest('hex');
const origin = 'https://consumer-blog-signature.ratriatra.workers.dev/';
function fixture(responses) {
  const calls = [], closed = [];
  const chromium = { launch: async () => ({
    close: async () => closed.push('browser'),
    newContext: async device => {
      let index = 0;
      return { close: async () => closed.push(device), newPage: async () => ({ goto: async url => {
        calls.push({ device, url });
        const r = responses(device, index++);
        return { url: () => r.url ?? url, status: () => r.status ?? 200, body: async () => Buffer.from(r.body), headers: () => ({ 'cf-cache-status': 'HIT', 'cf-ray': 'test-edge', date: 'test-date' }) };
      } }) };
    },
  }) };
  return { playwright: { chromium, devices: { 'Desktop Chrome': 'desktop', 'iPhone 13': 'mobile' } }, calls, closed };
}
const noWait = async () => {};
test('desktop and touch navigation must both return admitted bytes twice, without cache bypass or another upload', async () => {
  const f = fixture(() => ({ body: 'current' })), checks = [];
  await verifyBrowserSource(f.playwright, digest('current'), checks, noWait);
  assert.equal(checks.length, 4);
  assert.ok(f.calls.every(c => c.url === origin));
  assert.deepEqual(f.closed, ['desktop', 'mobile', 'browser']);
});
test('old browser response after a correct Node fetch cannot pass until current bytes settle', async () => {
  const f = fixture((_device, i) => ({ body: i === 0 || i === 2 ? 'previous' : 'current' })), checks = [];
  await verifyBrowserSource(f.playwright, digest('current'), checks, noWait);
  assert.equal(checks.length, 10);
  assert.equal(checks.filter(c => c.sha256 === digest('previous')).length, 4);
  assert.ok(checks.every(c => c.cacheStatus === 'HIT' && c.edge === 'test-edge'));
});
for (const device of ['desktop', 'mobile']) test('persistent stale ' + device + ' bytes fail closed and preserve evidence', async () => {
  const f = fixture(d => ({ body: d === device ? 'previous' : 'current' })), checks = [];
  await assert.rejects(verifyBrowserSource(f.playwright, digest('current'), checks, noWait), /differs from admitted root/);
  assert.equal(checks.filter(c => c.project === device).length, 6);
  assert.equal(f.closed.at(-1), 'browser');
});
for (const response of [{ body: 'current', url: 'https://example.invalid/' }, { body: 'current', status: 401 }]) test('unexpected origin/status never substitutes for an admitted navigation', async () => {
  const f = fixture(() => response);
  await assert.rejects(verifyBrowserSource(f.playwright, digest('current'), [], noWait), /Unexpected browser root/);
  assert.deepEqual(f.closed, ['desktop', 'browser']);
});
