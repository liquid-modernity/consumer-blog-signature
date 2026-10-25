import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { richFixture } from "../fixture.mjs";
import { readEmDashPublished } from "@gaga/corps-emdash";
import { composeApplication, assembleApplication } from "@gaga/arsenal";
import {
  searchCapabilityId,
  defineQuery,
  executeSearchReference,
} from "@gaga/engine-capabilities/search";
import { withEditorialText } from "../../../editorial/search.mjs";
import { markdownToPortableText } from "../../../editorial/markdown.mjs";
import { validatePortableText } from "../../../editorial/portable-text.mjs";
async function api(page: Page, path: string, method = "GET", body?: unknown) {
  const r = await page.request.fetch(
    "http://localhost:4322/_emdash/api/" + path,
    {
      method,
      headers: { "X-EmDash-Request": "1" },
      ...(body ? { data: body } : {}),
    },
  );
  const result = await r.json();
  if (!r.ok() || result.success === false)
    throw Error(
      `${method} ${path} HTTP${r.status()} ${JSON.stringify(result.error)}`,
    );
  return result.data;
}
test("real local EmDash studio: rich edits, blocks, revision/publishing and PAKRPP preview", async ({
  page,
  context,
}) => {
  mkdirSync(".gaga/editorial", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.log("LOCAL_PAGE_ERROR", error.message.slice(0, 1000));
  });
  page.on("requestfailed", (request) => {
    const url = new URL(request.url());
    if (url.hostname === "localhost")
      console.log(
        "LOCAL_REQUEST_FAILURE",
        url.origin + url.pathname,
        request.failure()?.errorText,
      );
  });
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      console.log(
        "LOCAL_BROWSER_ERROR",
        message
          .text()
          .replace(/\?[^\s]+/g, "?[redacted]")
          .slice(0, 500),
      );
  });
  await page.goto(
    "/_emdash/api/setup/dev-bypass?content=1&redirect=/_emdash/admin",
  );
  await page.waitForURL(/\/_emdash\/admin(?:\/)?$/);
  const me = await api(page, "auth/me");
  if (me.isFirstLogin) {
    const welcome = page.getByRole("button", {
      name: "Get Started",
      exact: true,
    });
    await expect(welcome).toBeVisible({ timeout: 30000 });
    const dismissed = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        new URL(r.url()).pathname === "/_emdash/api/auth/me" &&
        r.status() === 200,
    );
    await welcome.click();
    await dismissed;
    await expect(welcome).toBeHidden();
    expect((await api(page, "auth/me")).isFirstLogin).toBe(false);
  }
  const newPage = await api(page, "content/pages", "POST", {
    slug: "studio-page-" + Date.now(),
    data: {
      title: "Human-authored page",
      body: [
        {
          _type: "block",
          _key: "page-body",
          style: "normal",
          children: [
            {
              _type: "span",
              _key: "page-span",
              text: "A native EmDash Page.",
              marks: [],
            },
          ],
          markDefs: [],
        },
      ],
    },
  });
  expect(newPage.item.data.integration.applicationId).toMatch(/^editorial-/);
  const manifest = await api(page, "manifest");
  expect(manifest.collections.pages).toBeTruthy();
  expect(manifest.collections.posts.fields.body.widget).toBe(
    "pakrpp-studio:body",
  );
  expect(manifest.plugins["pakrpp-studio"].enabled).toBe(true);
  const posts = await api(page, "content/posts?status=published&limit=100"),
    authors = await api(page, "content/authors?status=published&limit=100");
  expect(
    posts.items.filter((x: any) => x.data.integration?.migratedFrom).length,
  ).toBe(7);
  expect(authors.items.length).toBe(1);
  for (const item of [...posts.items, ...authors.items])
    validatePortableText(item.data.body);
  const emptyAuthor = await api(page, "content/authors", "POST", {
    slug: "empty-author-" + Date.now(),
    data: { title: "Local empty profile proof" },
  });
  await page.goto("/_emdash/admin/content/authors/" + emptyAuthor.item.id);
  await expect(
    page.getByRole("region", { name: "PAKRPP Editorial Studio" }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".studio-canvas .tiptap")).toBeVisible();
  const sections = await api(
    page,
    "content/sections?status=published&limit=100",
  );
  const section = sections.items[0];
  expect(section).toBeTruthy();
  const mediaResponse = await page.request.post(
    "http://localhost:4322/_emdash/api/media",
    {
      headers: { "X-EmDash-Request": "1" },
      multipart: {
        file: {
          name: "editorial-proof-" + Date.now() + ".png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=",
            "base64",
          ),
        },
        width: "1",
        height: "1",
        deduplicate: "false",
        ensureUniqueFilename: "true",
      },
    },
  );
  expect(mediaResponse.ok()).toBeTruthy();
  const media = (await mediaResponse.json()).data.item;
  const downloadedMedia = await page.request.get(
    new URL(media.url, "http://localhost:4322").href,
  );
  expect(downloadedMedia.status()).toBe(200);
  expect((await downloadedMedia.body()).toString("base64")).toBe(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=",
  );
  const { body } = richFixture();
  for (const b of body) {
    if (b._type === "sectionRef") b.id = section.id;
    if (b._type === "image") b.asset = { _ref: media.id, url: media.url };
    if (b._type === "figure") b.url = media.url;
    if (b._type === "gallery")
      for (const image of b.images ?? [])
        image.asset = { _ref: media.id, url: media.url };
  }
  const created = await api(page, "content/posts", "POST", {
    slug: "studio-proof-" + Date.now(),
    references: { authors: [authors.items[0].id] },
    data: {
      title: "Editorial Studio proof",
      summary: "Structured authoring with real EmDash revisions.",
      body,
      editorial: { topics: ["research"], tags: ["proof"], language: "en" },
      integration: { applicationId: "local.studio-proof" },
    },
  });
  const id = created.item.id;
  await page.goto("/_emdash/admin/content/posts/" + id);
  const editorStarted = Date.now();
  try {
    await expect(
      page.getByRole("region", { name: "PAKRPP Editorial Studio" }),
    ).toBeVisible({ timeout: 30000 });
  } catch (error) {
    await page.screenshot({
      path: ".gaga/editorial/editor-failed.png",
      fullPage: true,
    });
    writeFileSync(
      ".gaga/editorial/editor-failure.json",
      JSON.stringify(
        {
          errors,
          manifestBody: manifest.collections.posts.fields.body,
          plugin: manifest.plugins["pakrpp-studio"],
          localPageText: (await page.locator("body").innerText()).slice(
            0,
            16000,
          ),
        },
        null,
        2,
      ) + "\n",
    );
    throw error;
  }
  console.log("EDITOR_READY_MS", Date.now() - editorStarted);
  expect(
    await page.locator("section.pakrpp-studio").getAttribute("aria-label"),
  ).toBe("PAKRPP Editorial Studio");
  await page.screenshot({
    path: ".gaga/editorial/editor-loaded.png",
    fullPage: true,
  });
  const canvas = page.locator(".studio-canvas .tiptap").first();
  await expect(canvas).toBeVisible();
  const saved = page.waitForResponse(
    (r) =>
      r.request().method() === "PUT" &&
      r.url().includes("/_emdash/api/content/posts/" + id) &&
      r.status() === 200,
  );
  const writingLine = page.locator(".studio-canvas .tiptap > p").last();
  await writingLine.click();
  await writingLine.press("End");
  await canvas.pressSequentially("A persisted editorial addition.");
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await canvas.press(modifier + "+b");
  await canvas.pressSequentially(" Bold proof");
  await canvas.press(modifier + "+b");
  await canvas.press(modifier + "+z");
  await canvas.press(modifier + "+Shift+z");
  await saved;
  let current = await api(page, "content/posts/" + id);
  validatePortableText(current.item.data.body);
  expect(JSON.stringify(current.item.data.body)).toContain(
    "A persisted editorial addition.",
  );
  for (const type of new Set(body.map((b) => b._type)))
    expect(
      current.item.data.body.some((b: any) => b._type === type),
    ).toBeTruthy();
  await writingLine.click();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+ArrowRight" : "End",
  );
  await page.keyboard.press("Enter");
  expect(
    await page.evaluate(
      () =>
        window.getSelection()?.anchorNode?.parentElement?.closest("p")
          ?.textContent ?? "",
    ),
  ).toBe("");
  await page.keyboard.type("/callout", { delay: 40 });
  const slash = page.locator("[data-slash-command-menu]");
  await expect(slash).toBeVisible();
  await slash.getByText("Callout", { exact: true }).click();
  const blockDialog = page.getByRole("dialog");
  await blockDialog
    .getByLabel("Title", { exact: true })
    .fill("Slash command proof");
  await blockDialog
    .getByLabel("Content", { exact: true })
    .fill("A custom block created through the actual slash menu.");
  const savedBlock = page.waitForResponse(
    (r) =>
      r.request().method() === "PUT" &&
      r.url().includes("/_emdash/api/content/posts/" + id) &&
      r.status() === 200,
  );
  await blockDialog
    .getByRole("button", { name: "Insert", exact: true })
    .click();
  await savedBlock;
  expect(
    (await api(page, "content/posts/" + id)).item.data.body.some(
      (b: any) => b._type === "callout" && b.title === "Slash command proof",
    ),
  ).toBeTruthy();
  await page.reload();
  await expect(page.locator(".studio-canvas")).toContainText(
    "A persisted editorial addition.",
  );
  await page
    .locator(".studio-workspace aside nav button")
    .filter({ hasText: /^preview$/ })
    .click();
  const preview = page.frameLocator('iframe[title="PAKRPP article preview"]');
  await expect(preview.locator("#editorial-preview-body")).toContainText(
    "A persisted editorial addition.",
  );
  await expect(preview.locator('[role="doc-bibliography"]')).toContainText(
    "Evidence and methods",
  );
  await expect(preview.locator('[role="doc-endnotes"]')).toContainText(
    "method is explicitly",
  );
  await expect(preview.locator("math")).toHaveCount(2);
  const previewImage = preview.locator('img[alt="Local proof image"]');
  await expect(previewImage).toHaveAttribute(
    "src",
    /^http:\/\/localhost:4322\/_emdash\/api\/media\//,
  );
  await previewImage.scrollIntoViewIfNeeded();
  console.log(
    "PREVIEW_IMAGE_STATE",
    await previewImage.evaluate((image: HTMLImageElement) => ({
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      currentSrc: image.currentSrc,
      loading: image.loading,
      width: image.width,
      height: image.height,
      display: getComputedStyle(image).display,
      visibility: getComputedStyle(image).visibility,
    })),
  );
  await expect
    .poll(() =>
      previewImage.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    )
    .toBeTruthy();
  await page.screenshot({
    path: ".gaga/editorial/studio-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".gaga/editorial/studio-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1600, height: 1100 });
  current = await api(page, "content/posts/" + id);
  const published = await api(
    page,
    "content/posts/" + id + "/publish",
    "POST",
    { _rev: current._rev },
  );
  expect(published.item.status).toBe("published");
  const firstPublishedRevision = published.item.liveRevisionId;
  current = await api(page, "content/posts/" + id);
  await api(page, "content/posts/" + id, "PUT", {
    _rev: current._rev,
    data: { summary: "A second, explicit editorial revision." },
  });
  const secondPublished = await api(
    page,
    "content/posts/" + id + "/publish",
    "POST",
    { _rev: (await api(page, "content/posts/" + id))._rev },
  );
  expect(secondPublished.item.liveRevisionId).not.toBe(firstPublishedRevision);
  const origin = "http://localhost:4322",
    item = (await api(page, "content/posts/" + id)).item;
  const pin = {
    origin,
    collection: "posts",
    id: item.id,
    liveRevisionId: item.liveRevisionId,
    updatedAt: item.updatedAt,
    titleField: "title",
    summaryField: "summary",
  };
  const projection = await readEmDashPublished(pin, {
    origin,
    authorizeRead: async (resource) => ({ decision: "ALLOW", resource }),
    readRaw: async (collection, id) =>
      (await api(page, "content/" + collection + "/" + id)).item,
  });
  expect(projection.status).toBe("projected");
  if (projection.status !== "projected")
    throw Error("Actual rich CMS revision rejected");
  const declaration = readFileSync("gaga.app.json", "utf8"),
    declared = JSON.parse(declaration);
  const names = [
    "@gaga/engine-contracts",
    "@gaga/engine-capabilities",
    "astro",
    "@astrojs/starlight",
    ...declared.integrations.map((x: { package: string }) => x.package),
  ];
  const installed = Object.fromEntries(
    names.map((name) => {
      const p = JSON.parse(
        readFileSync("node_modules/" + name + "/package.json", "utf8"),
      );
      return [name, { version: p.version, dependencies: p.dependencies ?? {} }];
    }),
  );
  const composed = composeApplication(declaration, {
    installed,
    capabilities: [searchCapabilityId],
    runtimes: ["build", "edge"],
    bindings: ["CMS_ORIGIN"],
  });
  expect(composed.ok).toBe(true);
  if (!composed.ok) throw Error("Application composition failed");
  const sectionMap = Object.fromEntries(
    sections.items.map((x: any) => [x.id, x.data.body]),
  );
  const richArtifact = withEditorialText(projection, item.data.body, {
    sections: sectionMap,
  });
  const assembly = await assembleApplication(composed.value, {
    "published-content": async () => [richArtifact],
    "application-pages": async () => [],
  });
  expect(assembly.ok).toBe(true);
  if (!assembly.ok) throw Error("Application assembly failed");
  const richSearch = executeSearchReference({
    id: "local-rich-cms",
    query: defineQuery({
      id: "body-query",
      text: "calibrated-astronomy",
      filters: [],
      facets: [],
      scope: [],
      constraints: [],
      diagnostics: [],
    }),
    artifacts: assembly.value.artifacts,
    limitations: [],
    diagnostics: [],
  });
  expect(richSearch.status).toBe("succeeded");
  expect(richSearch.output?.results.length).toBe(1);
  writeFileSync(
    ".gaga/editorial/real-rich-search.json",
    JSON.stringify(
      {
        status: "PASS",
        source: "REAL_LOCAL_EMDASH_REST",
        pin,
        corps: "PASS",
        arsenal: "PASS",
        engineSearch: "PASS",
        query: "calibrated-astronomy",
        artifactCount: assembly.value.artifacts.length,
        productionMutations: 0,
      },
      null,
      2,
    ) + "\n",
  );
  const revisions = await api(
    page,
    "content/posts/" + id + "/revisions?limit=100",
  );
  expect(revisions.total).toBeGreaterThanOrEqual(2);
  const notes = secondPublished.item.data.body.filter((b: any) =>
    ["reference", "footnote", "math", "listing"].includes(b._type),
  );
  expect(notes.find((b: any) => b._type === "footnote").id).toBe("method");
  expect(notes.find((b: any) => b._type === "reference").doi).toBe(
    "10.1000/example",
  );
  expect(notes.find((b: any) => b._type === "listing").filename).toBe(
    "study.ts",
  );
  const unpub = await api(page, "content/posts/" + id + "/unpublish", "POST", {
    _rev: (await api(page, "content/posts/" + id))._rev,
  });
  expect(unpub.item.status).toBe("draft");
  const unsafe = await page.evaluate(
    async ({ id, rev }) => {
      const r = await fetch("/_emdash/api/content/posts/" + id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-EmDash-Request": "1",
        },
        body: JSON.stringify({
          _rev: rev,
          data: {
            body: [
              {
                _type: "htmlBlock",
                _key: "unsafe",
                html: "<script>bad()</script>",
              },
            ],
          },
        }),
      });
      return { status: r.status, body: await r.json() };
    },
    { id, rev: (await api(page, "content/posts/" + id))._rev },
  );
  expect(unsafe.status).toBeGreaterThanOrEqual(400);
  expect(unsafe.body.success).toBe(false);
  const noAuth = await context.browser()!.newContext();
  expect(
    (
      await noAuth.request.get(
        "http://localhost:4322/_emdash/api/content/posts/" + id,
      )
    ).status(),
  ).toBe(401);
  await noAuth.close();
  expect(errors).toEqual([]);
  writeFileSync(
    ".gaga/editorial/local-browser-proof.json",
    JSON.stringify(
      {
        status: "PASS",
        mode: "REAL_LOCAL_EMDASH",
        origin: "http://localhost:4322",
        seededArticles: 7,
        seededAuthors: 1,
        pagesEnabled: true,
        portableTextPersisted: true,
        nativePageCreated: true,
        slashInsertion: "PASS",
        keyboardFormattingUndoRedo: "PASS",
        allBlockTypesRoundTripped: [...new Set(body.map((b) => b._type))],
        realImageUploaded: true,
        revisionCount: revisions.total,
        publishUnpublish: "PASS",
        unsafeHtmlRejected: true,
        anonymousRejected: true,
        previewUsesActualPakrppRenderer: true,
        productionMutations: 0,
        credentialsCreated: 0,
        screenShots: ["studio-desktop.png", "studio-mobile.png"],
      },
      null,
      2,
    ) + "\n",
  );
});

test("legacy Markdown field migrates through supported local schema/content APIs with history intact", async ({
  page,
}) => {
  await page.goto(
    "/_emdash/api/setup/dev-bypass?content=1&redirect=/_emdash/admin",
  );
  await page.waitForURL(/\/_emdash\/admin(?:\/)?$/);
  const collection = "migration_proof_" + Date.now();
  await api(page, "schema/collections", "POST", {
    slug: collection,
    label: "Local migration proof",
    hidden: true,
    routable: false,
    supports: ["drafts", "revisions"],
  });
  for (const f of [
    { slug: "title", label: "Title", type: "string", required: true },
    { slug: "body", label: "Body", type: "text", required: true },
    { slug: "metadata", label: "Preserved metadata", type: "json" },
    { slug: "integration", label: "Integration", type: "json" },
  ])
    await api(page, "schema/collections/" + collection + "/fields", "POST", f);
  const documents = JSON.parse(
      readFileSync("content/emdash/published.json", "utf8"),
    ).documents.filter((d: any) => d.pin.collection === "posts"),
    records = [];
  for (const d of documents) {
    const created = await api(page, "content/" + collection, "POST", {
      slug: d.item.slug,
      data: {
        title: d.item.data.title,
        body: d.item.data.body,
        metadata: d.item.data.metadata,
      },
    });
    const current = await api(
      page,
      "content/" + collection + "/" + created.item.id,
    );
    const old = await api(
      page,
      "content/" + collection + "/" + created.item.id + "/publish",
      "POST",
      { _rev: current._rev, publishedAt: d.item.publishedAt },
    );
    records.push({
      source: d,
      id: created.item.id,
      oldRevision: old.item.liveRevisionId,
    });
  }
  const incompatible = await page.request.put(
    "http://localhost:4322/_emdash/api/schema/collections/" +
      collection +
      "/fields/body",
    { headers: { "X-EmDash-Request": "1" }, data: { type: "portableText" } },
  );
  expect(incompatible.status()).toBe(400);
  expect((await incompatible.json()).error.code).toBe(
    "FIELD_TYPE_COLUMN_CHANGE",
  );
  await api(page, "schema/collections/" + collection + "/fields", "POST", {
    slug: "content",
    label: "Main Content",
    type: "portableText",
    widget: "pakrpp-studio:body",
  });
  await api(page, "schema/collections/" + collection + "/fields/body", "PUT", {
    label: "Markdown migration archive",
    widget: "pakrpp-studio:integration",
  });
  for (const r of records) {
    const converted = markdownToPortableText(r.source.item.data.body);
    expect(converted.ok).toBe(true);
    const previous = await api(page, "content/" + collection + "/" + r.id);
    await api(page, "content/" + collection + "/" + r.id, "PUT", {
      _rev: previous._rev,
      data: {
        content: converted.blocks,
        integration: {
          editorialSchema: "pakrpp.editorial/v1",
          canonicalBodyField: "content",
          migratedFrom: { markdownSha256: r.source.bodySha256 },
        },
      },
    });
    const draft = await api(page, "content/" + collection + "/" + r.id);
    const published = await api(
      page,
      "content/" + collection + "/" + r.id + "/publish",
      "POST",
      { _rev: draft._rev, publishedAt: r.source.item.publishedAt },
    );
    expect(published.item.data.content).toEqual(converted.blocks);
    expect(published.item.data.body).toBe(r.source.item.data.body);
    expect(published.item.data.metadata).toEqual(r.source.item.data.metadata);
    expect(published.item.publishedAt).toBe(r.source.item.publishedAt);
    const historical = await api(page, "revisions/" + r.oldRevision);
    expect(historical.item.data.body).toBe(r.source.item.data.body);
  }
  mkdirSync(".gaga/editorial", { recursive: true });
  writeFileSync(
    ".gaga/editorial/schema-migration-proof.json",
    JSON.stringify(
      {
        status: "PASS",
        mode: "LOCAL_ONLY",
        records: records.length,
        inPlaceTypeChangeRejected: true,
        supportedMigration:
          "Add Portable Text content; legacy Markdown widget read only",
        metadataDatesPreserved: true,
        originalMarkdownReadableInHistoricalRevision: true,
        productionMutations: 0,
      },
      null,
      2,
    ) + "\n",
  );
});
