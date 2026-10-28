import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { richFixture } from "../fixture.mjs";

async function api(page: Page, path: string, method = "GET", data?: unknown) {
  const response = await page.request.fetch("http://localhost:4322/_emdash/api/" + path, {
    method, headers: { "X-EmDash-Request": "1" }, ...(data ? { data } : {}),
  });
  expect(response.ok()).toBeTruthy();
  const result = await response.json();
  expect(result.success).toBe(true);
  return result.data;
}
async function signIn(page: Page) {
  await page.goto("/_emdash/api/setup/dev-bypass?content=1&redirect=/_emdash/admin");
  await page.waitForURL(/\/_emdash\/admin(?:\/)?$/);
  if ((await api(page, "auth/me")).isFirstLogin)
    await page.getByRole("button", { name: "Get Started", exact: true }).click();
}
const block = (key: string, text: string, style = "normal") => ({
  _type: "block", _key: key, style, markDefs: [],
  children: [{ _type: "span", _key: key + "-span", text, marks: [] }],
});

test("outline selects the requested duplicate heading in the current native document", async ({ page }) => {
  await signIn(page);
  const created = await api(page, "content/posts", "POST", {
    slug: "duplicate-heading-proof", data: {
      title: "Duplicate headings", summary: "Local outline regression",
      body: [block("first", "Methods", "h2"), block("middle", "Between headings"), block("second", "Methods", "h2")],
    },
  });
  await page.goto("/_emdash/admin/content/posts/" + created.item.id);
  const headings = page.locator(".studio-canvas .tiptap h2");
  await expect(headings).toHaveCount(2);
  const target = page.getByRole("button", { name: "Methods", exact: true });
  if (await target.count() === 0)
    await page.getByRole("button", { name: /^outline$/i }).click();
  await target.nth(1).click();
  const selectedHeading = () => headings.evaluateAll(nodes => {
    const anchor = window.getSelection()?.anchorNode;
    return nodes.findIndex(node => !!anchor && node.contains(anchor));
  });
  await expect.poll(selectedHeading).toBe(1);
  await page.keyboard.press("End");
  const saved = page.waitForResponse(r => r.request().method() === "PUT" && r.url().includes(created.item.id) && r.status() === 200);
  await page.keyboard.type(" updated"); await saved;
  await expect(headings.nth(0)).toHaveText("Methods");
  await expect(headings.nth(1)).toHaveText("Methods updated");
  await page.reload();
  await page.getByRole("button", { name: /^outline$/i }).click();
  await page.getByRole("button", { name: "Methods updated", exact: true }).click();
  await expect.poll(selectedHeading).toBe(1);
});

async function article(page: Page, slug: string, body = [block("writing", "A writing line")]) {
  const result = await api(page, "content/posts", "POST", {
    slug, data: { title: "Editorial quality proof", summary: "A deterministic local editorial fixture", body },
  });
  await page.goto("/_emdash/admin/content/posts/" + result.item.id);
  await expect(page.locator(".studio-canvas .tiptap")).toBeVisible();
  return result.item;
}
const canvasOf = (page: Page) => page.locator(".studio-canvas .tiptap");
const saveOf = (page: Page, id: string) => page.waitForResponse(r => r.request().method() === "PUT" && r.url().includes("/content/posts/" + id) && r.status() === 200);
const evidence = (name: string, value: unknown) => {
  mkdirSync(".gaga/editorial/quality", { recursive: true });
  writeFileSync(".gaga/editorial/quality/" + name + ".json", JSON.stringify(value, null, 2) + "\n");
};

test.beforeEach(async ({ context }) => {
  // Browser fixtures cannot contact production, media/CDN or release providers.
  await context.route("**/*", route => {
    const host = new URL(route.request().url()).hostname;
    return ["localhost", "127.0.0.1"].includes(host) ? route.continue() : route.abort();
  });
});

test("optional utilities preserve native editor identity, selection, keyboard editing, undo and composition", async ({ page }) => {
  await signIn(page);
  const item = await article(page, "utility-editing-proof");
  const canvas = canvasOf(page), original = await canvas.elementHandle();
  for (const name of ["Outline", "References", "Readiness"])
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("complementary", { name: "Editorial utility" })).toBeHidden();
  await canvas.locator("p").first().click(); await page.keyboard.press("End");
  let saved = saveOf(page, item.id);
  await page.keyboard.type(" Added"); await saved;
  await page.keyboard.press("Control+b");
  saved = saveOf(page, item.id); await page.keyboard.type(" Bold"); await page.keyboard.press("Control+b"); await saved;
  await expect(canvas.locator("strong")).toContainText("Bold");
  await page.keyboard.press("Control+z");
  await expect(canvas).not.toContainText("Bold");
  saved = saveOf(page, item.id); await page.keyboard.press("Control+Shift+z"); await saved;
  await expect(canvas).toContainText("Bold");
  await page.getByRole("button", { name: "References", exact: true }).click();
  const panel = page.getByRole("complementary", { name: "Editorial utility" });
  await expect(panel).toBeVisible();
  await page.getByRole("button", { name: "Readiness", exact: true }).click();
  await expect(panel.getByRole("heading", { name: "Body readiness" })).toBeVisible();
  await expect(page.getByRole("button", { name: "References", exact: true })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Readiness", exact: true }).click();
  expect(await original!.evaluate(el => el === document.querySelector(".studio-canvas .tiptap") && el.isConnected)).toBe(true);
  await canvas.focus();
  saved = saveOf(page, item.id); await page.keyboard.type(" Continued"); await saved;
  await expect(canvas.locator("p").first()).toContainText("Bold Continued");
  await canvas.dispatchEvent("compositionstart", { data: "" });
  await page.keyboard.insertText(" 日本語");
  saved = saveOf(page, item.id);
  await canvas.dispatchEvent("compositionend", { data: "日本語" });
  await page.keyboard.press("ArrowRight"); await saved;
  await expect(canvas).toContainText("日本語");
  // Exercise the existing native heading shortcut and slash/block dialog.
  await page.keyboard.press("Enter"); await page.keyboard.type("Keyboard heading");
  await page.keyboard.press("Control+Alt+2");
  await expect(canvas.locator("h2")).toContainText("Keyboard heading");
  await page.keyboard.press("End"); await page.keyboard.press("Enter");
  await page.keyboard.type("/callout", { delay: 35 });
  const slash = page.locator("[data-slash-command-menu]"); await expect(slash).toBeVisible();
  await slash.getByText("Callout", { exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title", { exact: true }).fill("Quality callout");
  await dialog.getByLabel("Content", { exact: true }).fill("A native plugin block.");
  saved = saveOf(page, item.id); await dialog.getByRole("button", { name: "Insert", exact: true }).click(); await saved;
  await page.reload();
  await expect(canvas).toContainText("日本語");
  expect((await api(page, "content/posts/" + item.id)).item.data.body.some((b: any) => b._type === "callout" && b.title === "Quality callout")).toBe(true);
  const revisions = await api(page, "content/posts/" + item.id + "/revisions?limit=100");
  expect(revisions.total).toBeGreaterThan(1);
  evidence("editing", { status: "PASS", editorIdentityPreserved: true, undoRedo: true, nativeKeyboard: true, compositionEventSimulation: true, physicalImeTest: false, saveReload: true, revisionHistory: revisions.total });
});

test("private saved preview keeps exact pins, canonical renderer, denial and disabled publishing", async ({ page, context }) => {
  await signIn(page);
  const { body } = richFixture();
  const item = await article(page, "private-preview-quality-proof", body.filter((b: any) => !["sectionRef", "image", "gallery", "figure", "video"].includes(b._type)) as any);
  const before = (await api(page, "content/posts/" + item.id)).item;
  const previewButton = page.getByRole("button", { name: "Preview saved draft", exact: true });
  const response = page.waitForResponse(r => r.url().endsWith("/plugins/pakrpp-studio/content-preview") && r.request().method() === "POST");
  await previewButton.click();
  const r = await response, payload = r.request().postDataJSON(), result = await r.json();
  expect(payload.resource).toBe("posts/" + item.id);
  expect(payload.selectedRevision).toBe(before.draftRevisionId);
  expect(payload.expectedPublishedRevision ?? null).toBe(before.liveRevisionId ?? null);
  expect(result.data.status).toBe("PREVIEW READY");
  expect(result.data.selectedRevision).toBe(before.draftRevisionId);
  const iframe = page.locator('iframe[title="Private article preview"]');
  await expect(iframe).toHaveAttribute("sandbox", "");
  const preview = page.frameLocator('iframe[title="Private article preview"]');
  await expect(preview.locator("article h1")).toHaveText(before.data.title);
  await expect(preview.locator('[role="doc-bibliography"]')).toContainText("Evidence and methods");
  await expect(preview.locator('[role="doc-endnotes"]')).toContainText("method is explicitly");
  await expect(preview.locator("math")).toHaveCount(2);
  const privateUrl = "http://localhost:4322/_emdash/api/plugins/pakrpp-studio/content-preview";
  const anonymous = await context.browser()!.newContext();
  expect([401, 403]).toContain((await anonymous.request.post(privateUrl, { data: payload, headers: { "X-EmDash-Request": "1" } })).status());
  await anonymous.close();
  const denied = await page.request.post(privateUrl, { data: payload, headers: { "Origin": "https://untrusted.example", "X-EmDash-Request": "1" } });
  expect(denied.status()).toBe(403);
  // Stale selected/live identities are rejected by the actual private route.
  for (const stale of [{ ...payload, selectedRevision: "not-the-selected-revision" }, { ...payload, expectedPublishedRevision: "not-the-live-revision" }]) {
    const conflict = await page.request.post(privateUrl, { data: stale, headers: { "X-EmDash-Request": "1" } });
    expect((await conflict.json()).data.status).toBe("PREVIEW UNAVAILABLE");
  }
  const unavailable = page.waitForResponse(r => r.url().endsWith("/plugins/pakrpp-studio/content-publish"));
  await page.getByRole("button", { name: "Publish saved draft", exact: true }).click();
  expect((await (await unavailable).json()).data.status).toBe("PUBLISHING UNAVAILABLE");
  const after = (await api(page, "content/posts/" + item.id)).item;
  expect(after.liveRevisionId ?? null).toBe(before.liveRevisionId ?? null);
  expect(after.draftRevisionId).toBe(before.draftRevisionId);
  expect(after.data).toEqual(before.data);
  evidence("saved-preview", { status: "PASS", selectedRevision: before.draftRevisionId, exactPins: true, canonicalRenderer: true, sandbox: true, anonymousDenied: true, csrfDenied: true, stalePinsDenied: true, publishingDisabled: true, publishUnpublishOperations: 0 });
});

test("Pages retain saved readiness without content-release actions", async ({ page }) => {
  await signIn(page);
  const p = await api(page, "content/pages", "POST", { slug: "page-readiness-proof", data: { title: "Page readiness", body: [block("page", "Page body")] } });
  await page.goto("/_emdash/admin/content/pages/" + p.item.id);
  await expect(page.getByText("Saved revision readiness", { exact: true })).toBeVisible();
  await expect(page.locator(".pakrpp-studio-saved")).toContainText("Saved revision:");
  await expect(page.getByRole("button", { name: "Publish saved draft", exact: true })).toHaveCount(0);
});

test("responsive native canvas, inspector and app controls across desktop and mobile", async ({ page }) => {
  test.setTimeout(180000);
  await signIn(page);
  const item = await article(page, "responsive-quality-proof", [block("heading", "A long-form writing canvas", "h2"), block("p", "Readable native content with contextual editorial utilities.")]);
  const canvas = canvasOf(page);
  await expect(page.locator(".studio-integration")).toHaveCount(0);
  await expect(page.getByText("Integration identity · managed", { exact: true })).toHaveCount(0);
  const measurements: unknown[] = [];
  for (const width of [1600, 1440, 1280, 1024, 1023, 768, 390, 360, 320]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 1100 : 844 });
    const close = page.getByRole("button", { name: "Close settings", exact: true });
    if (await close.isVisible()) await close.click();
    await expect(canvas).toBeVisible();
    const layout = await page.evaluate(() => {
      const widthOf = (s: string) => document.querySelector(s)!.getBoundingClientRect().width;
      const page = document.querySelector(".emdash-editor-page")!, style = getComputedStyle(page);
      return { viewport: innerWidth, document: document.documentElement.scrollWidth, canvas: widthOf(".studio-canvas"), workspace: widthOf(".studio-workspace"), pageMax: style.maxWidth, gutter: style.paddingInlineStart };
    });
    expect(layout.document).toBeLessThanOrEqual(width + 1);
    expect(Math.abs(layout.canvas - layout.workspace)).toBeLessThan(1);
    expect(layout.pageMax).toBe("832px");
    const outline = page.getByRole("button", { name: "Outline", exact: true });
    if (width < 1024) expect((await outline.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    measurements.push(layout);
    if ([1600, 390].includes(width)) {
      await page.screenshot({ path: `.gaga/editorial/quality/${width}-light.png`, fullPage: true });
    }
  }
  await page.setViewportSize({ width: 1600, height: 1100 });
  const resize = page.getByRole("separator", { name: "Resize settings panel" });
  const oldWidth = Number(await resize.getAttribute("aria-valuenow"));
  await resize.focus(); await resize.press("ArrowLeft");
  await expect.poll(async () => Number(await resize.getAttribute("aria-valuenow"))).toBeGreaterThan(oldWidth);
  await resize.press("ArrowRight");
  await expect(resize).toHaveAttribute("aria-valuenow", String(oldWidth));
  // Switch native theme through its existing HTML theme contract, not app styles.
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.emulateMedia({ colorScheme: "dark" });
  await page.screenshot({ path: ".gaga/editorial/quality/1600-dark.png", fullPage: true });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 390, height: 844 });
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  await settings.click(); await expect(page.getByRole("button", { name: "Close settings", exact: true })).toBeVisible();
  await page.screenshot({ path: ".gaga/editorial/quality/390-settings.png", fullPage: true });
  await page.keyboard.press("Escape"); await expect(settings).toBeFocused();
  expect((await api(page, "content/posts/" + item.id)).item.status).toBe("draft");
  evidence("responsive", { status: "PASS", measurements, nativeInspectorKeyboardResize: true, nativeMobileSheetFocusReturn: true, themes: ["light", "dark"] });
});

test("keyboard disclosures and public accessibility tree retain native limitations explicitly", async ({ page, context }) => {
  await signIn(page); await article(page, "keyboard-quality-proof");
  const outline = page.getByRole("button", { name: "Outline", exact: true });
  await outline.focus(); await page.keyboard.press("Enter");
  await expect(outline).toHaveAttribute("aria-expanded", "true");
  const controls = await outline.getAttribute("aria-controls");
  expect(controls).toBeTruthy();
  await page.getByRole("button", { name: "Readiness", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(outline).toHaveAttribute("aria-expanded", "false");
  const panel = page.getByRole("complementary", { name: "Editorial utility" });
  await panel.locator("h3").evaluate(el => { el.setAttribute("tabindex", "-1"); (el as HTMLElement).focus(); });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Readiness", exact: true })).toBeFocused();
  const style = await page.getByRole("button", { name: "Readiness", exact: true }).evaluate(el => ({ outline: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth }));
  expect(style.outline).not.toBe("none"); expect(parseFloat(style.width)).toBeGreaterThanOrEqual(2);
  const cdp = await context.newCDPSession(page);
  const tree = await cdp.send("Accessibility.getFullAXTree");
  const controlsAx = tree.nodes.filter((node: any) => node.role?.value === "button" && ["Outline", "References", "Readiness"].includes(node.name?.value));
  expect(controlsAx).toHaveLength(3);
  const textbox = tree.nodes.filter((node: any) => node.role?.value === "textbox");
  evidence("accessibility", { status: "APP_CONTROLS_PASS_NATIVE_ISSUES_RETAINED", nativeTextboxNames: textbox.map((node: any) => node.name?.value ?? ""), appControlNames: controlsAx.map((node: any) => node.name.value), disclosureKeyboard: true, focusVisible: true, screenReaderSession: "NOT_RUN", nativeTextboxNameFixed: false, nativeReadOnlyBridgeFixed: false });
  await cdp.detach();
});

test("developer-only preview is absent outside its explicit loopback development context", async ({ page }) => {
  await page.goto("http://127.0.0.1:4322/_emdash/api/setup/dev-bypass?content=1&redirect=/_emdash/admin");
  await page.waitForURL(/127\.0\.0\.1:4322\/_emdash\/admin(?:\/)?$/);
  const response = await page.request.get("http://127.0.0.1:4322/_emdash/api/content/posts?status=published&limit=1");
  expect(response.ok()).toBe(true);
  const item = (await response.json()).data.items[0];
  await page.goto("http://127.0.0.1:4322/_emdash/admin/content/posts/" + item.id);
  await expect(canvasOf(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Developer preview", exact: true })).toHaveCount(0);
  await expect(page.locator('iframe[src="http://localhost:3000/editorial-preview"]')).toHaveCount(0);
});

test("rich media, reusable sections and native picker remain on their existing public paths", async ({ page }) => {
  await signIn(page);
  const upload = await page.request.post("http://localhost:4322/_emdash/api/media", {
    headers: { "X-EmDash-Request": "1" }, multipart: {
      file: { name: "quality-proof.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=", "base64") },
      width: "1", height: "1", deduplicate: "false", ensureUniqueFilename: "true",
    },
  });
  expect(upload.ok()).toBe(true);
  const media = (await upload.json()).data.item;
  const sections = (await api(page, "content/sections?status=published&limit=100")).items;
  const { body } = richFixture();
  for (const b of body as any[]) {
    if (b._type === "sectionRef") b.id = sections[0].id;
    if (b._type === "image") b.asset = { _ref: media.id, url: media.url };
    if (b._type === "figure") b.url = media.url;
    if (b._type === "gallery") for (const image of b.images) image.asset = { _ref: media.id, url: media.url };
  }
  const item = await article(page, "rich-media-quality-proof", body as any);
  const canvas = canvasOf(page);
  await expect(canvas.locator("table")).toBeVisible();
  await expect(canvas).toContainText("Evidence and methods");
  await page.getByRole("button", { name: "Readiness", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Editorial utility" })).not.toContainText("Unknown reusable section");
  await page.getByRole("button", { name: "Readiness", exact: true }).click();
  const settings = page.getByRole("region", { name: "Editorial settings", exact: true });
  await settings.locator("summary").filter({ hasText: /^Editorial settings$/ }).click();
  await settings.locator("summary").filter({ hasText: /^Media/ }).click();
  const picker = settings.getByRole("button", { name: "Choose Featured Image", exact: true });
  await picker.click();
  const dialog = page.getByRole("dialog", { name: "Select editorial image" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(picker).toBeFocused();
  await page.screenshot({ path: ".gaga/editorial/quality/rich-media.png", fullPage: true });
  const persisted = (await api(page, "content/posts/" + item.id)).item.data.body;
  expect(persisted).toEqual(body);
  evidence("rich-media", { status: "PASS", types: [...new Set(body.map(b => b._type))], nativeTable: true, actualMediaUpload: true, pickerOpenCancelFocus: true, sectionIdentity: sections[0].id, persistedBodyUnchanged: true, videoPlayback: "NOT_TESTED" });
});
