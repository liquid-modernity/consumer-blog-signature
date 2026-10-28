import { test, expect, type Page } from "@playwright/test";

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
