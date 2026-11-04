const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.GAGA_CHROMIUM_EXECUTABLE ? { executablePath: process.env.GAGA_CHROMIUM_EXECUTABLE } : {})
  });
  try {
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      for (const reducedMotion of ['reduce', 'no-preference']) {
        const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion });
        try {
          await page.goto(process.env.GAGA_TEST_ORIGIN ?? 'http://127.0.0.1:3020/', { waitUntil: 'networkidle' });
          const initial = await page.evaluate(() => ({
            owner: document.scrollingElement === document.documentElement,
            snap: getComputedStyle(document.documentElement).scrollSnapType,
            duplicate: !!document.querySelector('[data-gaga-inline-reentry]')
          }));
          assert.ok(initial.owner && initial.snap.startsWith('y') && !initial.duplicate);
          const stages = page.locator('[data-pakrpp-viewport-stage]');
          assert.equal(await stages.count(), 4);
          for (const stage of await stages.all()) {
            await stage.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
            await page.waitForTimeout(400);
            const geometry = await stage.evaluate(el => {
              const outer = el.getBoundingClientRect();
              const inner = el.querySelector('.pakrpp-viewport-stage__inner').getBoundingClientRect();
              return { top: outer.top, center: (inner.top + inner.bottom - outer.top - outer.bottom) / 2, overflow: el.scrollHeight > el.clientHeight + 2, index: el.dataset.stageIndex, current: document.querySelector('[data-gaga-outline-current-index]')?.textContent };
            });
            assert.ok(Math.abs(geometry.top) < 3 && Math.abs(geometry.center) < 3 && !geometry.overflow && geometry.current === geometry.index, JSON.stringify({ width, reducedMotion, geometry }));
          }
          await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
          await page.waitForTimeout(300);
          await page.mouse.move(10, 400);
          await page.mouse.wheel(0, 650);
          await page.waitForTimeout(700);
          const forward = await page.evaluate(() => scrollY);
          await page.mouse.wheel(0, -650);
          await page.waitForTimeout(700);
          const reverse = await page.evaluate(() => scrollY);
          assert.ok(forward > reverse, JSON.stringify({ width, reducedMotion, forward, reverse }));
          if (width === 390 && reducedMotion === 'no-preference') {
            await page.evaluate(() => {
              document.body.dataset.gagaReaderMotion = 'reduced';
              window.__rootScrollBehaviors = [];
              const original = Element.prototype.scrollIntoView;
              Element.prototype.scrollIntoView = function (options) {
                if (this.hasAttribute('data-pakrpp-viewport-stage')) window.__rootScrollBehaviors.push(options?.behavior);
                return original.call(this, options);
              };
            });
            await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
            await page.waitForTimeout(400);
            const fallback = page.locator('[data-gaga-surface-reentry] [data-gaga-outline-opener]');
            if (await fallback.isVisible()) await fallback.click();
            else await page.locator('[data-gaga-outline-peek-preview]').click();
            await page.locator('[data-gaga-outline-peek] [data-gaga-local-navigation] a[href="/#topics"]').first().click();
            assert.deepEqual(await page.evaluate(() => window.__rootScrollBehaviors), ['auto']);
          }
        } finally {
          await page.close();
        }
      }
    }
    console.log('Homepage scroll owner, center alignment and direction: 12/12 PASS');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
