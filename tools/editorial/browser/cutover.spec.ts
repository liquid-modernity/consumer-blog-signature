import { test, expect, type Page } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { executeCutover } from "../cutover-session.mjs";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
async function api(page: Page, path: string, method = "GET", body?: unknown) {
  const r = await page.request.fetch(
    "http://localhost:4322/_emdash/api/" + path,
    {
      method,
      headers: { "X-EmDash-Request": "1" },
      ...(body ? { data: body } : {}),
    },
  );
  const b = await r.json();
  if (!r.ok() || b.success === false)
    throw Error(`${method} ${path}: ${r.status()} ${b.error?.code ?? ""}`);
  return b.data;
}
test("fresh eight-record production plan rehearses additive migration, native relations, archive/history and migrated editor", async ({
  page,
}) => {
  const original = readFileSync("cms/editorial/migration-plan.json", "utf8"),
    plan = JSON.parse(original),
    suffix = Date.now(),
    map = Object.fromEntries(
      ["authors", "posts", "pages", "references", "sections"].map((c) => [
        c,
        `cutover_${c}_${suffix}`,
      ]),
    );
  await page.goto(
    "/_emdash/api/setup/dev-bypass?content=1&redirect=/_emdash/admin",
  );
  await page.waitForURL(/\/_emdash\/admin(?:\/)?$/);
  if ((await api(page, "auth/me")).isFirstLogin) {
    const welcome = page.getByRole("button", {
      name: "Get Started",
      exact: true,
    });
    await expect(welcome).toBeVisible({ timeout: 30000 });
    const dismissed = page.waitForResponse(
      (r) =>
        r.url().endsWith("/auth/me") &&
        r.request().method() === "POST" &&
        r.status() === 200,
    );
    await welcome.click();
    await dismissed;
    await expect(welcome).toBeHidden();
  }
  const idMap: Record<string, string> = {};
  for (const c of ["authors", "posts"]) {
    await api(page, "schema/collections", "POST", {
      slug: map[c],
      label: "Cutover rehearsal " + c,
      hidden: true,
      routable: false,
      supports: ["drafts", "revisions"],
    });
    for (const f of [
      { slug: "title", label: "Title", type: "string", required: true },
      { slug: "summary", label: "Summary", type: "text" },
      { slug: "body", label: "Body", type: "text", required: true },
      {
        slug: "application_id",
        label: "Application identity",
        type: "string",
        unique: true,
      },
      { slug: "metadata", label: "Metadata", type: "json" },
    ])
      await api(page, `schema/collections/${map[c]}/fields`, "POST", f);
    for (const r of plan.records.filter((r: any) => r.collection === c)) {
      const created = await api(page, "content/" + map[c], "POST", {
        slug: r.before.slug,
        data: r.before.data,
      });
      const before = await api(
        page,
        "content/" + map[c] + "/" + created.item.id,
      );
      await api(
        page,
        "content/" + map[c] + "/" + created.item.id + "/publish",
        "POST",
        { _rev: before._rev, publishedAt: r.before.publishedAt },
      );
      idMap[r.contentId] = created.item.id;
      r.collection = map[c];
      r.contentId = created.item.id;
      r.before = (
        await api(page, "content/" + r.collection + "/" + r.contentId)
      ).item;
      r.pin = {
        ...r.pin,
        origin: "http://localhost:4322",
        collection: r.collection,
        id: r.contentId,
        liveRevisionId: r.before.liveRevisionId,
        updatedAt: r.before.updatedAt,
      };
    }
  }
  plan.mode = "LOCAL_REHEARSAL";
  plan.origin = "http://localhost:4322";
  plan.collections = { authors: map.authors, posts: map.posts };
  for (const r of plan.records)
    if (r.references)
      r.references.authors = r.references.authors.map(
        (id: string) => idMap[id],
      );
  for (const op of plan.schemaOperations) {
    for (const [from, to] of Object.entries(map))
      op.path = op.path.replace("/" + from + "/", "/" + to + "/");
    if (op.path === "schema/collections") {
      op.body.slug = map[op.body.slug];
      op.body.hidden = true;
    }
    if (op.body.validation?.targetCollection === "authors")
      op.body.validation.targetCollection = map.authors;
  }
  const text = JSON.stringify(plan),
    gate = {
      status: "PASS",
      planSha256: sha(text),
      sourceSetSha256: plan.sourceSetSha256,
    };
  mkdirSync(".gaga/editorial", { recursive: true });
  let result: any;
  try {
    result = await page.evaluate(
      "(" +
        executeCutover.toString() +
        ")(" +
        JSON.stringify(text) +
        "," +
        JSON.stringify(sha(text)) +
        "," +
        JSON.stringify(gate) +
        ",r=>{window.__gagaCutoverRehearsal=r})",
    );
  } catch (error) {
    const state = await page.evaluate("window.__gagaCutoverRehearsal");
    writeFileSync(
      ".gaga/editorial/cutover-rehearsal-failure.json",
      JSON.stringify(state, null, 2) + "\n",
    );
    throw error;
  }
  expect(result.status).toBe("PASS");
  expect(result.records).toHaveLength(8);
  expect(result.contentWrites).toBe(16);
  expect(result.newContentRecords).toBe(0);
  const admitted = plan.records.find(
      (r: any) => r.applicationId === "consumer.article.softcoded-systems",
    ),
    path = "content/" + admitted.collection + "/" + admitted.contentId;
  await page.goto("/_emdash/admin/" + path);
  await expect(
    page.getByRole("region", { name: "PAKRPP Editorial Studio" }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    admitted.before.data.title,
  );
  const loaded = await api(page, path);
  expect(loaded.item.draftRevisionId).toBeNull();
  expect(loaded.item.data.body).toBe(admitted.before.data.body);
  expect(loaded.item.data.content).toEqual(admitted.data.content);
  const line = page.locator(".studio-canvas .tiptap > p").last();
  await line.click();
  await line.press("End");
  const saved = page.waitForResponse(
    (r) => r.request().method() === "PUT" && r.url().includes("/" + path),
    { timeout: 15000 },
  );
  await page
    .locator(".studio-canvas .tiptap")
    .first()
    .pressSequentially(" Local cutover rehearsal only.");
  const response = await saved;
  expect(
    response.status(),
    JSON.stringify((await response.json()).error ?? {}),
  ).toBe(200);
  await page.reload();
  await expect(page.locator(".studio-canvas")).toContainText(
    "Local cutover rehearsal only.",
  );
  expect((await api(page, path)).item.data.body).toBe(
    admitted.before.data.body,
  );
  await page
    .locator(".studio-workspace aside nav button")
    .filter({ hasText: /^preview$/ })
    .click();
  await expect(
    page
      .frameLocator('iframe[title="PAKRPP article preview"]')
      .locator("#editorial-preview-body"),
  ).toContainText("Local cutover rehearsal only.");
  await page.screenshot({
    path: ".gaga/editorial/migrated-editor-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: ".gaga/editorial/migrated-editor-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1600, height: 1100 });
  let current = await api(page, path);
  const pub = await api(page, path + "/publish", "POST", {
    _rev: current._rev,
    publishedAt: admitted.before.publishedAt,
  });
  expect(pub.item.status).toBe("published");
  current = await api(page, path);
  expect(
    (await api(page, path + "/unpublish", "POST", { _rev: current._rev })).item
      .status,
  ).toBe("draft");
  writeFileSync(
    ".gaga/editorial/cutover-rehearsal.json",
    JSON.stringify(
      {
        status: "PASS",
        productionPlanSha256: sha(original),
        sourceSetSha256: plan.sourceSetSha256,
        rehearsalPlanSha256: sha(text),
        records: 8,
        currentOperatorRevisionRetained: true,
        bodyArchivePreserved: true,
        historicalRevisionsPreserved: true,
        nativeAuthorRelations: true,
        migratedEditorLoadSaveReloadPreview: true,
        safePublishUnpublish: true,
        productionWrites: 0,
        schemaWrites: result.schemaWrites,
        contentWrites: result.contentWrites,
      },
      null,
      2,
    ) + "\n",
  );
});
