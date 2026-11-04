import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  for (const motion of ['reduce', 'no-preference'] as const) {
    for (const path of ['/', '/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity']) {
      test(`${path} ${width} ${motion}: Notch re-entry and focus`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.emulateMedia({ reducedMotion: motion });
        await page.goto(path, { waitUntil: 'networkidle' });
        await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime', 'ready');
        const handle = page.locator('[data-gaga-notch-reentry]');
        const notch = page.locator('[data-gaga-action-runtime]');
        const outline = page.locator('[data-gaga-outline-stack]');
        await page.mouse.move(5, 400);
        await page.mouse.wheel(0, 350);
        await page.waitForTimeout(500);
        for (const fraction of [0, .25, .5, .75, 1]) {
          if (await handle.isVisible()) break;
          await page.evaluate(f => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * f, behavior: 'instant' }), fraction);
          await page.waitForTimeout(500);
        }
        await expect(handle).toBeVisible();
        await expect(handle).toHaveAttribute('aria-controls', 'gaga-action-runtime');
        await expect(page.locator('[data-gaga-action-runtime-container]')).toHaveAttribute('data-gaga-signature-state', 'retracted');
        if (await outline.count() && await outline.isVisible()) await expect(outline).toHaveAttribute('data-gaga-signature-state', 'retracted');
        const box = await handle.boundingBox();
        expect(box).not.toBeNull();
        const blocked = await handle.evaluate(el => {
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return hit !== el && !el.contains(hit);
        });
        expect(blocked).toBe(false);
        const occluded = await handle.evaluate(el => {
          const r = el.getBoundingClientRect();
          return [...document.querySelectorAll('main a,main button,main input,main video[controls],main p,main h1,main h2,main h3')].flatMap(target => {
            if (target === el || el.contains(target)) return [];
            const t = target.getBoundingClientRect();
            if (t.right <= r.left || t.left >= r.right || t.bottom <= r.top || t.top >= r.bottom) return [];
            const hit = document.elementFromPoint((Math.max(t.left,r.left)+Math.min(t.right,r.right))/2, (Math.max(t.top,r.top)+Math.min(t.bottom,r.bottom))/2);
            return hit === el || !!hit && el.contains(hit) ? [{tag: target.tagName, text: target.textContent?.trim().slice(0, 100), target: t.toJSON(), handle: r.toJSON()}] : [];
          });
        });
        if (width === 320 || width === 1440) await page.screenshot({ path: `.gaga/quiet-v4-${path === '/' ? 'home' : 'article'}-${width}-${motion}.png` });
        expect(occluded).toEqual([]);
        await handle.focus();
        await expect(handle).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(notch).toHaveAttribute('data-gaga-state', 'peek');
        await expect(notch).not.toHaveAttribute('inert', '');
        await page.keyboard.press('Escape');
        await expect(handle).toBeFocused();
        await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
        await expect(notch).toHaveAttribute('data-gaga-state', 'peek');
        await page.keyboard.press('Escape');
        await expect(handle).toBeFocused();
      });
    }
  }
}

test('default composition contains no duplicate navigation or Outline openers', async ({ page }) => {
  for (const path of ['/', '/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.locator('[data-gaga-surface-reentry], [data-gaga-inline-reentry]')).toHaveCount(0);
    await expect(page.locator('[data-gaga-outline-opener]')).toHaveCount(1);
  }
});

test('full-viewport media keeps the Notch handle available without covering media controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const figure = document.createElement('figure');
    figure.id = 'quiet-v4-media-fixture';
    figure.style.cssText = 'position:relative;width:100vw;height:200vh;margin:0';
    const image = document.createElement('img');
    image.alt = 'Synthetic editorial media';
    image.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="1800"%3E%3Crect width="400" height="1800" fill="black"/%3E%3C/svg%3E';
    image.style.cssText = 'width:100%;height:100%;object-fit:contain';
    figure.append(image);
    document.querySelector('main')!.prepend(figure);
    window.scrollTo({ top: figure.offsetTop + innerHeight / 2, behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  const handle = page.locator('[data-gaga-notch-reentry]');
  await expect(handle).toBeVisible();
  await handle.click();
  await expect(page.locator('[data-gaga-action-runtime]')).toHaveAttribute('data-gaga-state', 'peek');
  await page.keyboard.press('Escape');
  await expect(handle).toBeFocused();
});

test('Notch projects Outline and restores a usable focus target', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity', { waitUntil: 'networkidle' });
  await page.mouse.move(5, 400);
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(500);
  const handle = page.locator('[data-gaga-notch-reentry]');
  if (await handle.isVisible()) await handle.click();
  else await page.locator('[data-gaga-action-island-toggle]').click();
  const action = page.locator('[data-gaga-document-outline-action]');
  await expect(action).toBeVisible();
  await action.click();
  await expect(page.locator('[data-gaga-outline-peek]')).toHaveAttribute('data-gaga-state', 'open');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-gaga-outline-peek]')).toHaveAttribute('data-gaga-state', 'closed');
  const focus = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return !!el && el !== document.body && el.isConnected && !el.closest('[hidden],[inert],[aria-hidden="true"]') && el.getClientRects().length > 0;
  });
  expect(focus).toBe(true);
});

test('full-viewport video retains both native controls and Notch access', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const video = document.createElement('video');
    video.id = 'quiet-v4-video-fixture';
    video.controls = true;
    video.style.cssText = 'display:block;width:100vw;height:200vh;object-fit:contain';
    document.querySelector('main')!.prepend(video);
    window.scrollTo({ top: video.offsetTop + innerHeight / 2, behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  const video = page.locator('#quiet-v4-video-fixture');
  await expect(video).toHaveAttribute('controls', '');
  const handle = page.locator('[data-gaga-notch-reentry]');
  await expect(handle).toBeVisible();
  await handle.click();
  await expect(page.locator('[data-gaga-action-runtime]')).toHaveAttribute('data-gaga-state', 'peek');
  await page.keyboard.press('Escape');
  await expect(handle).toBeFocused();
});
