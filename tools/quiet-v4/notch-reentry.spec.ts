import { test, expect, type Page } from '@playwright/test';

async function inViewport(page: Page, selector: string) {
  return page.locator(selector).evaluate(el => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && s.visibility === 'visible' && Number(s.opacity) > 0;
  });
}

async function unobstructed(page: Page) {
  return page.evaluate(() => {
    const surfaces = [...document.querySelectorAll<HTMLElement>('[data-gaga-action-runtime], [data-gaga-outline-peek-preview]')];
    const walker = document.createTreeWalker(document.querySelector('main')!, NodeFilter.SHOW_TEXT);
    const conflicts: string[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent?.trim() || !node.parentElement || node.parentElement.closest('[data-gaga-action-runtime], [data-gaga-outline-stack], [hidden], [inert], [aria-hidden="true"]')) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
        for (const surface of surfaces) {
          const b = surface.getBoundingClientRect(), style = getComputedStyle(surface);
          if (style.visibility === 'hidden' || Number(style.opacity) < .05) continue;
          const l = Math.max(r.left,b.left,0), t = Math.max(r.top,b.top,0), right = Math.min(r.right,b.right,innerWidth), bottom = Math.min(r.bottom,b.bottom,innerHeight);
          if (right <= l || bottom <= t) continue;
          const hit = document.elementFromPoint((l+right)/2,(t+bottom)/2);
          if (hit && surface.contains(hit)) conflicts.push(node.textContent.trim().slice(0, 80));
        }
      }
    }
    for (const target of document.querySelectorAll<HTMLElement>('main a[href], main button, main input, main select, main textarea, main summary')) {
      if (target.closest('[data-gaga-action-runtime], [data-gaga-outline-stack], [hidden], [inert], [aria-hidden="true"]')) continue;
      const r = target.getBoundingClientRect();
      for (const surface of surfaces) {
        const b = surface.getBoundingClientRect(), style = getComputedStyle(surface);
        if (style.visibility === 'hidden' || Number(style.opacity) < .05) continue;
        const l = Math.max(r.left,b.left,0), t = Math.max(r.top,b.top,0), right = Math.min(r.right,b.right,innerWidth), bottom = Math.min(r.bottom,b.bottom,innerHeight);
        if (right <= l || bottom <= t) continue;
        const hit = document.elementFromPoint((l+right)/2,(t+bottom)/2);
        if (hit && surface.contains(hit)) conflicts.push('control: ' + (target.getAttribute('aria-label') || target.textContent?.trim() || target.tagName).slice(0,80));
      }
    }
    return conflicts;
  });
}

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  for (const motion of ['reduce', 'no-preference'] as const) {
    for (const path of ['/', '/topics', '/archive', '/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity']) {
      test(`${path} ${width} ${motion}: canonical signature navigation`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.emulateMedia({ reducedMotion: motion });
        await page.goto(path, { waitUntil: 'networkidle' });
        await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime', 'ready');
        await expect(page.locator('[data-gaga-notch-reentry], [data-gaga-surface-reentry], [data-gaga-inline-reentry]')).toHaveCount(0);
        await expect(page.locator('[data-gaga-outline-opener]')).toHaveCount(1);
        const notch = page.locator('[data-gaga-action-runtime]');
        const toggle = page.locator('[data-gaga-action-island-toggle]');
        const opener = page.locator('[data-gaga-outline-opener]');
        await expect(notch).not.toHaveAttribute('inert', '');
        await page.mouse.move(5, 400);
        for (const delta of [350, 350, -500]) {
          await page.mouse.wheel(0, delta);
          await page.waitForTimeout(350);
          expect(await unobstructed(page)).toEqual([]);
        }
        await toggle.focus();
        await expect(toggle).toBeFocused();
        await expect.poll(() => inViewport(page, '[data-gaga-action-runtime]')).toBe(true);
        await page.keyboard.press('Enter');
        await expect(notch).toHaveAttribute('data-gaga-state', 'peek');
        await page.keyboard.press('Escape');
        await expect(toggle).toBeFocused();
        const box = await toggle.boundingBox(); expect(box).not.toBeNull();
        await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
        await expect(notch).toHaveAttribute('data-gaga-state', 'peek');
        await page.keyboard.press('Escape');
        await opener.focus();
        await expect(opener).toBeFocused();
        await expect.poll(() => inViewport(page, '[data-gaga-outline-peek-preview]')).toBe(true);
        await page.keyboard.press('Enter');
        await expect(page.locator('[data-gaga-outline-peek]')).toHaveAttribute('data-gaga-state', 'open');
        await page.keyboard.press('Escape');
        const focus = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          return !!el && el !== document.body && el.isConnected && !el.closest('[hidden],[inert],[aria-hidden="true"]') && el.getClientRects().length > 0;
        });
        expect(focus).toBe(true);
        if (width === 320 || width === 1440) await test.info().attach('signature-screenshot', { body: await page.screenshot(), contentType: 'image/png' });
      });
    }
  }
}

test('full-viewport video retains native controls and canonical surfaces return after reading', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const video = document.createElement('video'); video.id = 'quiet-v4-video-fixture'; video.controls = true;
    video.style.cssText = 'display:block;width:100vw;height:200vh;object-fit:contain';
    document.querySelector('main')!.prepend(video);
    window.scrollTo({ top: video.offsetTop + innerHeight / 2, behavior: 'instant' });
  });
  await page.mouse.wheel(0, 100); await page.waitForTimeout(500);
  const video = page.locator('#quiet-v4-video-fixture');
  await expect(video).toHaveAttribute('controls', '');
  await video.focus(); await expect(video).toBeFocused();
  const mediaHit = await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight - 24)?.id);
  expect(mediaHit).toBe('quiet-v4-video-fixture');
  expect(await unobstructed(page)).toEqual([]);
  await page.locator('#quiet-v4-video-fixture').scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, -1200); await page.waitForTimeout(700);
  const toggle = page.locator('[data-gaga-action-island-toggle]');
  await toggle.focus(); await expect(toggle).toBeFocused();
  await expect.poll(() => inViewport(page, '[data-gaga-action-runtime]')).toBe(true);
});
