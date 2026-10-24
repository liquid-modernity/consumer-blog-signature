import { test, expect } from "@playwright/test";
test("native publication shell and Dynamic Notch remain interactive", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-gaga-publishing-shell",
    "native",
  );
  const toggle = page.locator("[data-gaga-action-island-toggle]");
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.screenshot({
    path: ".gaga/" + info.project.name + "-home.png",
    fullPage: true,
  });
});
test("real publication, public Engine Search and knowledge routes keep application presentation", async ({
  page,
}, info) => {
  await page.goto("/publications/akal-imitasi-sebagai-pekerja-tanpa-dignity");
  await expect(page.locator("body")).toContainText("Akal Imitasi");
  await expect(page.locator("[data-gaga-action-runtime]")).toBeVisible();
  await page.screenshot({
    path: ".gaga/" + info.project.name + "-article.png",
    fullPage: true,
  });
  await page.goto("/search?q=Akal%20Imitasi");
  await expect(page.locator("[data-gaga-search-results]")).toContainText(
    "Akal Imitasi",
  );
  const response = await page.request.get("/api/search?q=Akal%20Imitasi");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe("succeeded");
  expect(body.output.results.length).toBeGreaterThan(0);
  await page.goto("/knowledge");
  await expect(page.locator("body")).toContainText("Pengetahuan");
});
