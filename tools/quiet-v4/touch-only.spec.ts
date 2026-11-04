import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  for (const path of ['/', '/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity']) {
    test(`touch-only scrolling and return ${path} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime', 'ready');
      const cdp = await page.context().newCDPSession(page);
      const swipe = async (startY: number, endY: number) => {
        const x = Math.min(width - 10, Math.max(10, width / 2));
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY }] });
        for (let i = 1; i <= 8; i++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: startY + (endY - startY) * i / 8 }] });
          await page.waitForTimeout(35);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(500);
      };
      try {
        await swipe(700, 300);
        await swipe(300, 700);
        const toggle = page.locator('[data-gaga-action-island-toggle]');
        try {
          await expect.poll(async () => {
            const box = await toggle.boundingBox();
            return !!box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= 844 && !await page.locator('[data-gaga-action-runtime]').evaluate(el => (el as HTMLElement).inert);
          }).toBe(true);
        } catch (error) {
          console.log('TOUCH_VISIBILITY_DIAGNOSTIC', JSON.stringify(await page.evaluate(() => {
            const container = document.querySelector<HTMLElement>('[data-gaga-action-runtime-container]')!;
            const rect = container.getBoundingClientRect();
            const overlaps = Array.from(document.querySelectorAll<HTMLElement>('main a,main button,main p,main h1,main h2,main img,main video,main span')).flatMap(el => {
              const r = el.getBoundingClientRect();
              return r.right > rect.left - 24 && r.left < rect.right + 24 && r.bottom > rect.top - 24 && r.top < rect.bottom + 24 && r.bottom > 0 && r.top < innerHeight ? [{tag:el.tagName, text:el.textContent?.trim().slice(0,60), rect:r.toJSON()}] : [];
            });
            return {scrollY, state:container.dataset.gagaSignatureState, conflict:container.hasAttribute('data-gaga-content-conflict'), rect:rect.toJSON(), toggle:document.querySelector('[data-gaga-action-island-toggle]')?.getBoundingClientRect().toJSON(), overlaps:overlaps.slice(0,20)};
          })));
          throw error;
        }
        const box = await toggle.boundingBox();
        await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
        await expect(page.locator('[data-gaga-action-runtime]')).toHaveAttribute('data-gaga-state', 'peek');
        await expect.poll(async () => { const box = await page.locator('[data-gaga-action-runtime]').boundingBox(); return !!box && box.x >= -1 && box.x + box.width <= width + 1; }).toBe(true);
      } finally { await cdp.detach(); }
    });
  }
}

for (const width of [320, 390, 1440]) {
  for (const path of ['/about/author', '/knowledge/tags']) {
    test(`canonical Outline is directly reachable ${path} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('html')).toHaveAttribute('data-gaga-runtime', 'ready');
      await page.waitForTimeout(500);
      const opener = page.locator('[data-gaga-outline-opener]');
      console.log('OUTLINE_VISIBILITY_DIAGNOSTIC', JSON.stringify(await page.evaluate(() => {
        const stack = document.querySelector<HTMLElement>('[data-gaga-outline-stack]')!;
        const opener = stack.querySelector<HTMLElement>('[data-gaga-outline-opener]')!;
        const stackRect = stack.getBoundingClientRect(), r = opener.getBoundingClientRect();
        const box = { left:stackRect.left+(stackRect.width-opener.offsetWidth)/2, right:stackRect.left+(stackRect.width+opener.offsetWidth)/2, top:stackRect.top, bottom:stackRect.top+opener.offsetHeight };
        const overlaps = Array.from(document.querySelectorAll<HTMLElement>('main a,main button,main p,main h1,main h2,main img,main video,main span')).flatMap(el => {
          const rect = el.getBoundingClientRect();
          return rect.right > box.left-2 && rect.left < box.right+2 && rect.bottom > box.top-2 && rect.top < box.bottom+2 && rect.bottom > 0 && rect.top < innerHeight ? [{tag:el.tagName,text:el.textContent?.trim().slice(0,60),rect:rect.toJSON()}] : [];
        });
        return {scrollY,state:stack.dataset.gagaSignatureState,conflict:stack.hasAttribute('data-gaga-content-conflict'),stack:stackRect.toJSON(),opener:r.toJSON(),box,overlaps:overlaps.slice(0,20)};
      })));
      const box = await opener.boundingBox();
      expect(box && box.y >= 0 && box.y + box.height <= 844).toBe(true);
      await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await expect(page.locator('[data-gaga-outline-peek]')).toHaveAttribute('data-gaga-state', 'open');
    });
  }
}
