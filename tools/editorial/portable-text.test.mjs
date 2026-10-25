import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { markdownToPortableText } from "../../editorial/markdown.mjs";
import {
  validatePortableText,
  renderPortableText,
  plainText,
  analyzeEditorial,
  safeUrl,
  admittedTypes,
  editorialBody,
} from "../../editorial/portable-text.mjs";
import { richFixture } from "./fixture.mjs";
import { blockRegistry } from "../../editorial/registry.mjs";
import { readEmDashPublished } from "@gaga/corps-emdash";
import { withEditorialText } from "../../editorial/search.mjs";
import {
  defineQuery,
  executeSearchReference,
} from "@gaga/engine-capabilities/search";
test("every registered block renders safely and survives a deterministic Portable Text JSON round trip", () => {
  const { body, sections } = richFixture();
  assert.deepEqual(
    validatePortableText(JSON.parse(JSON.stringify(body))),
    body,
  );
  const html = renderPortableText(body, { sections });
  for (const type of admittedTypes)
    assert.ok(
      body.some((b) => b._type === type),
      type,
    );
  for (const token of [
    "<strong>",
    "<em>",
    "<u>",
    "<code",
    "<ol",
    "<ul",
    "<blockquote",
    "<hr>",
    "<img",
    "<video",
    "<table",
    "doc-bibliography",
    "doc-endnotes",
    "doc-backlink",
    "<math",
    "study.ts",
    "A reusable section",
  ])
    assert.ok(html.includes(token), token);
  assert.ok(html.includes('href="#fnref-method-1"'));
  assert.ok(!html.includes("onerror="));
});
test("Markdown conversion preserves core writing, nested lists, quotes, language, tables, footnotes and math", () => {
  const source =
    "# Heading\n\n**bold**, *italic*, `code` and [source](https://example.org).\n\n3. First\n4. Second\n   - Nested\n\n> A quotation\n\n---\n\n```ts study.ts\nconst n = 1;\n```\n\n| Key | Value |\n| --- | --- |\n| a | b |\n\nA note[^method] with $x^2$.\n\n[^method]: Method recorded.\n";
  const r = markdownToPortableText(source);
  assert.equal(r.ok, true, JSON.stringify(r.unsupported));
  assert.deepEqual(markdownToPortableText(source), r);
  const html = renderPortableText(r.blocks);
  assert.ok(html.includes('id="heading"'));
  assert.ok(html.includes("<strong>bold</strong>,"));
  assert.ok(html.includes('start="3"'));
  assert.ok(html.includes("study.ts"));
  assert.ok(html.includes('role="doc-noteref"'));
  assert.ok(html.includes("<math"));
});
test("unsupported Markdown never silently loses HTML, MDX, mixed images or task state", () => {
  for (const input of [
    "<script>alert(1)</script>",
    "- [x] Task complete",
    "Hello ![mixed](/image.png)",
    "> ## Nested heading",
  ]) {
    const r = markdownToPortableText(input);
    assert.equal(r.ok, false, input);
    assert.equal(r.blocks, null);
    assert.ok(r.unsupported.length);
  }
});
test("all seven admitted articles and author convert with deterministic identities and text", () => {
  const source = JSON.parse(readFileSync("content/emdash/published.json"));
  assert.equal(source.documents.length, 8);
  for (const d of source.documents) {
    const a = markdownToPortableText(d.item.data.body),
      b = markdownToPortableText(d.item.data.body);
    assert.equal(a.ok, true, d.applicationId);
    assert.deepEqual(a, b);
    assert.ok(plainText(a.blocks).length > 20);
  }
});
test("security rejects raw executable blocks, unsafe URLs, marks and ambiguous identities", () => {
  const { body } = richFixture();
  for (const bad of [
    [{ _type: "htmlBlock", _key: "bad", html: "<script>evil()</script>" }],
    [{ _type: "iframe", _key: "bad", src: "https://example.org" }],
    [{ _type: "image", _key: "bad", asset: { url: "javascript:alert(1)" } }],
    [
      {
        _type: "block",
        _key: "bad",
        children: [
          { _type: "span", _key: "child", text: "x", marks: ["unknown"] },
        ],
      },
    ],
    [...body, { ...body[0] }],
  ])
    assert.throws(() => validatePortableText(bad));
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,evil",
    "//evil.example",
    "https://u:p@example.org/",
    "/\\evil.example",
  ])
    assert.equal(safeUrl(url), null);
});
test("renderer escapes text, code, metadata and untrusted math without executable HTML", () => {
  const r = markdownToPortableText("```html\n<script>alert(1)</script>\n```");
  const html = renderPortableText(r.blocks);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  const math = [
    {
      _type: "math",
      _key: "math",
      id: "math-id",
      formula: "\\href{javascript:alert(1)}{unsafe}",
      display: "block",
    },
  ];
  assert.ok(!renderPortableText(math).includes('href="javascript:'));
});
test("readiness is deterministic and advisory, with missing metadata/alt and broken reference warnings", () => {
  const b = markdownToPortableText(
    "### Skipped\n\n![missing](/image.png)\n\n[Unknown](#ref-unknown)",
  ).blocks;
  b.find((x) => x._type === "image").alt = "";
  const a = analyzeEditorial(b);
  assert.deepEqual(analyzeEditorial(b), a);
  assert.ok(a.warnings.includes("Missing title"));
  assert.ok(a.warnings.includes("Missing summary"));
  assert.ok(a.warnings.some((x) => x.startsWith("Missing alt")));
  assert.ok(a.warnings.some((x) => x.startsWith("Broken reference")));
  assert.ok(a.warnings.some((x) => x.startsWith("Heading skips")));
  assert.equal(a.imageCount, 1);
});
test("cyclic and unavailable reusable sections fail explicitly", () => {
  const b = [{ _type: "sectionRef", _key: "section", id: "same" }];
  assert.throws(() => renderPortableText(b), /Missing reusable section/);
  assert.throws(
    () => renderPortableText(b, { sections: { same: b } }),
    /Cyclic/,
  );
});
test("Corps published admission precedes app-owned rich body extraction and real Engine Search", async () => {
  const raw = JSON.parse(readFileSync("content/emdash/published.json"))
      .documents[0],
    { body, sections } = richFixture();
  const projection = await readEmDashPublished(raw.pin, {
    origin: raw.pin.origin,
    authorizeRead: async (resource) => ({ decision: "ALLOW", resource }),
    readRaw: async () => ({ ...raw.item, data: { ...raw.item.data, body } }),
  });
  assert.equal(projection.status, "projected");
  const artifact = withEditorialText(projection, body, { sections });
  assert.ok(
    !artifact.searchableFields
      .find((f) => f.field === "body")
      .value.includes("10.1000/example"),
  );
  const result = executeSearchReference({
    id: "editorial-body",
    query: defineQuery({
      id: "body-query",
      text: "calibrated-astronomy",
      filters: [],
      facets: [],
      scope: [],
      constraints: [],
      diagnostics: [],
    }),
    artifacts: [artifact],
    limitations: [],
    diagnostics: [],
  });
  assert.equal(result.status, "succeeded");
  assert.equal(result.output.results.length, 1);
  assert.throws(() => withEditorialText({ status: "rejected" }, body));
});
test("slash block registry is unique, categorized and declarative", () => {
  assert.equal(
    new Set(blockRegistry.map((x) => x.type)).size,
    blockRegistry.length,
  );
  for (const b of blockRegistry) {
    assert.ok(["Knowledge", "Technical", "Reusable"].includes(b.category));
    assert.ok(b.fields.length);
    assert.ok(!JSON.stringify(b).includes("eval"));
  }
});
test("relative CMS media resolves only through an explicit verified host origin", () => {
  const body = [
    {
      _type: "image",
      _key: "image",
      asset: { url: "/_emdash/api/media/file/image.png" },
      alt: "CMS media",
    },
  ];
  assert.ok(
    renderPortableText(body, { mediaOrigin: "http://localhost:4322" }).includes(
      "http://localhost:4322/_emdash/api/media/file/image.png",
    ),
  );
  assert.ok(
    renderPortableText(body, {
      mediaOrigin: "https://cms.example.org",
    }).includes("https://cms.example.org/_emdash/api/media/file/image.png"),
  );
  assert.throws(() =>
    renderPortableText(body, { mediaOrigin: "http://untrusted.example" }),
  );
});
test("rich images reserve known dimensions and do not defer zero-size unknown media forever", () => {
  const body = [
    {
      _type: "image",
      _key: "image",
      asset: { url: "https://example.org/image.png" },
      alt: "Test",
    },
  ];
  assert.ok(renderPortableText(body).includes('loading="eager"'));
  body[0].width = 640;
  body[0].height = 480;
  const html = renderPortableText(body);
  assert.ok(html.includes('loading="lazy" width="640" height="480"'));
});

test("one canonical rich body is selected without falling back to the Markdown archive", () => {
  const content = markdownToPortableText("Canonical rich body").blocks;
  assert.equal(editorialBody({ body: "Legacy Markdown" }), "Legacy Markdown");
  assert.deepEqual(
    editorialBody({
      body: "Archive",
      content,
      integration: { canonicalBodyField: "content" },
    }),
    content,
  );
  assert.throws(() =>
    editorialBody({
      body: "Archive",
      integration: { canonicalBodyField: "content" },
    }),
  );
  assert.throws(() =>
    editorialBody({
      body: content,
      integration: { canonicalBodyField: "unknown" },
    }),
  );
});
test("reusable section text is included in Search and analysis, with unresolved sections failing closed", () => {
  const { body, sections } = richFixture();
  assert.ok(plainText(body, { sections }).includes("A reusable section"));
  assert.throws(() => plainText(body), /Missing reusable section/);
  assert.ok(
    analyzeEditorial(body).warnings.some((w) =>
      w.startsWith("Missing reusable section"),
    ),
  );
  assert.ok(
    !analyzeEditorial(body, {}, { sections }).warnings.some((w) =>
      w.startsWith("Missing reusable section"),
    ),
  );
});
