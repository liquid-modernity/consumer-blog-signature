import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.env.GAGA_EVIDENCE_DIRECTORY!;
mkdirSync(out, { recursive: true });
const paneSelector = '[data-sidebar="sidebar"][data-mobile="true"][aria-label="Settings"]';
const block = (key: string, text: string, style = "normal") => ({
  _type: "block", _key: key, style, markDefs: [],
  children: [{ _type: "span", _key: key + "-span", text, marks: [] }],
});
async function api(page: Page, path: string, method = "GET", data?: unknown) {
  const response = await page.request.fetch("http://localhost:4322/_emdash/api/" + path, {
    method, headers: { "X-EmDash-Request": "1" }, ...(data ? { data } : {}),
  });
  expect(response.ok()).toBeTruthy();
  const result = await response.json();
  expect(result.success).toBe(true);
  return result.data;
}
async function fixture(page: Page, slug: string) {
  await page.goto("/_emdash/api/setup/dev-bypass?content=1&redirect=/_emdash/admin");
  await page.waitForURL(/\/_emdash\/admin(?:\/)?$/);
  if ((await api(page, "auth/me")).isFirstLogin) {
    const updated = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/auth/me") && r.status() === 200);
    await page.getByRole("button", { name: "Get Started", exact: true }).click();
    await updated;
  }
  const created = await api(page, "content/posts", "POST", {
    slug, data: {
      title: "Editorial quality proof", summary: "A deterministic local editorial fixture",
      body: [block("heading", "A long-form writing canvas", "h2"), block("p", "Readable native content with contextual editorial utilities.")],
    },
  });
  await page.goto("/_emdash/admin/content/posts/" + created.item.id);
  await expect(page.locator(".studio-canvas .tiptap")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return created.item.id as string;
}
async function state(page: Page) {
  return page.evaluate(selector => {
    const pane = document.querySelector<HTMLElement>(selector);
    const box = pane?.getBoundingClientRect();
    const css = pane && getComputedStyle(pane);
    const backdrop = pane?.previousElementSibling as HTMLElement | null;
    return {
      time: performance.now(), viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      pane: pane && box && css ? {
        state: pane.dataset.state, ariaHidden: pane.getAttribute("aria-hidden"), inert: pane.inert,
        x: box.x, right: box.right, y: box.y, width: box.width, height: box.height,
        visibleWidth: Math.max(0, Math.min(innerWidth, box.right) - Math.max(0, box.left)),
        transform: css.transform, translate: css.translate, transition: css.transition,
        animations: pane.getAnimations().map(a => ({
          playState: a.playState, currentTime: a.currentTime,
          timing: a.effect?.getComputedTiming(),
          frames: (a.effect as KeyframeEffect | null)?.getKeyframes(),
        })),
      } : null,
      backdropOpacity: backdrop ? getComputedStyle(backdrop).opacity : null,
      activeTag: document.activeElement?.tagName,
      activeInsideSettings: !!pane?.contains(document.activeElement),
      active: document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim().slice(0, 100),
    };
  }, paneSelector);
}
async function settled(page: Page, open: boolean) {
  await expect(page.locator(paneSelector)).toHaveCount(1);
  await expect.poll(async () => {
    const s = await state(page), p = s.pane;
    return !!p && p.state === (open ? "expanded" : "collapsed") &&
      p.ariaHidden === String(!open) && p.inert === !open &&
      p.animations.every(a => a.playState === "finished") &&
      (open ? Math.abs(p.x - (s.viewport - Math.min(320, s.viewport))) < 1 && Math.abs(p.right - s.viewport) < 1 : p.visibleWidth < 0.01);
  }, { message: "Native Settings pane must reach its real open/closed geometry without disabling animations" }).toBe(true);
  const s = await state(page);
  expect(s.documentWidth).toBeLessThanOrEqual(s.viewport + 1);
  return s;
}
async function capture(page: Page, name: string) {
  const s = await state(page);
  writeFileSync(join(out, name + ".json"), JSON.stringify(s, null, 2) + "\n");
  await page.screenshot({ path: join(out, name + ".png"), fullPage: true });
  return s;
}

test.beforeEach(async ({ context }) => {
  // The seeded review can access only loopback services, never production.
  await context.route("**/*", route => ["localhost", "127.0.0.1"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});

for (const width of [320, 360, 390, 768]) {
  test(`native Settings closed/open/focus/state at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const id = await fixture(page, "mobile-evidence-" + width);
    const before = await api(page, "content/posts/" + id);
    const revisionsBefore = await api(page, "content/posts/" + id + "/revisions?limit=100");
    const canvas = page.locator(".studio-canvas .tiptap");
    const original = await canvas.elementHandle();
    const settings = page.getByRole("button", { name: "Settings", exact: true });
    await expect(settings).toBeVisible();
    await settled(page, false);
    const closed = await capture(page, width + "-closed");
    await settings.click();
    await settled(page, true);
    await expect(page.getByRole("button", { name: "Close settings", exact: true })).toBeFocused();
    const open = await capture(page, width + "-open");
    await page.getByRole("button", { name: "Close settings", exact: true }).click();
    await settled(page, false);
    const buttonRestoresFocus = await settings.evaluate(el => el === document.activeElement);
    expect.soft(buttonRestoresFocus, "Native X close must restore focus to Settings").toBe(true);
    const afterClose = await capture(page, width + "-closed-after-button");
    await settings.press("Enter");
    await settled(page, true);
    await page.keyboard.press("Escape");
    await settled(page, false);
    await expect(settings).toBeFocused();
    const afterEscape = await state(page);
    await settings.press("Enter"); await settled(page, true);
    await page.getByRole("button", { name: "Close settings", exact: true }).press("Enter");
    await settled(page, false);
    const keyboardCloseRestoresFocus = await settings.evaluate(el => el === document.activeElement);
    expect.soft(keyboardCloseRestoresFocus, "Native keyboard X close must restore focus to Settings").toBe(true);
    const afterKeyboardClose = await state(page);
    expect(await original!.evaluate(el => el.isConnected && el === document.querySelector(".studio-canvas .tiptap"))).toBe(true);
    expect(await api(page, "content/posts/" + id)).toEqual(before);
    expect(await api(page, "content/posts/" + id + "/revisions?limit=100")).toEqual(revisionsBefore);
    writeFileSync(join(out, width + "-result.json"), JSON.stringify({ status: buttonRestoresFocus && keyboardCloseRestoresFocus ? "PASS" : "NATIVE_FOCUS_DEFECT", width, closed, open, afterClose, afterEscape, afterKeyboardClose, buttonRestoresFocus, keyboardCloseRestoresFocus, escapeRestoresFocus: true, editorIdentityPreserved: true, localDraftAndRevisionsUnchanged: true }, null, 2) + "\n");
  });
}

test("replay original resize capture sequence and inspect native transitions", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await fixture(page, "mobile-original-sequence");
  const samples = [];
  for (const width of [1600, 1440, 1280, 1024, 1023, 768, 390, 360, 320]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 1100 : 844 });
    const initial = await state(page);
    const close = page.getByRole("button", { name: "Close settings", exact: true });
    const clicked = await close.isVisible();
    if (clicked) await close.click();
    await expect(page.locator(".studio-canvas .tiptap")).toBeVisible();
    const immediate = await state(page);
    if (width === 390) await capture(page, "390-original-sequence-immediate");
    samples.push({ width, initial, clicked, immediate });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeVisible();
  const close = page.getByRole("button", { name: "Close settings", exact: true });
  if ((await state(page)).pane?.state === "expanded") await close.click();
  await settled(page, false);
  const final = await capture(page, "390-original-sequence-settled");
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  await settings.click(); await settled(page, true);
  await close.click();
  const transition = [];
  for (let i = 0; i < 24; i++) {
    transition.push(await state(page));
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  }
  await settled(page, false);
  writeFileSync(join(out, "resize-transition.json"), JSON.stringify({ status: "PASS", samples, final, transition }, null, 2) + "\n");
});
