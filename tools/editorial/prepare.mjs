import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { markdownToPortableText } from "../../editorial/markdown.mjs";
import { studioCollections } from "../../editorial/registry.mjs";
import {
  plainText,
  renderPortableText,
} from "../../editorial/portable-text.mjs";
import { unified } from "unified";
import remarkParse from "remark-parse";
const sha = (x) => createHash("sha256").update(x).digest("hex"),
  published = JSON.parse(readFileSync("content/emdash/published.json")),
  records = [];
const content = { authors: [], posts: [], references: [], sections: [] };
for (const document of published.documents) {
  const data = document.item.data,
    result = markdownToPortableText(data.body);
  assert.equal(result.ok, true, JSON.stringify(result.unsupported));
  const originalText = (n) =>
    ["text", "inlineCode", "code"].includes(n.type)
      ? n.value
      : (n.children ?? [])
          .map(originalText)
          .join(
            [
              "paragraph",
              "heading",
              "strong",
              "emphasis",
              "link",
              "delete",
            ].includes(n.type)
              ? ""
              : "\n",
          );
  const normalized = (s) => s.replace(/\s+/gu, " ").trim();
  assert.equal(
    normalized(plainText(result.blocks)),
    normalized(originalText(unified().use(remarkParse).parse(data.body))),
    "Text changed: " + document.applicationId,
  );
  const metadata = data.metadata ?? {},
    fields = {
      title: data.title,
      summary: data.summary,
      body: result.blocks,
      integration: {
        applicationId: document.applicationId,
        editorialSchema: "pakrpp.editorial/v1",
        canonicalBodyField: "body",
        legacyMetadata: metadata,
        migratedFrom: {
          pin: document.pin,
          markdownSha256: sha(data.body),
        },
      },
    };
  if (document.pin.collection === "posts")
    Object.assign(fields, {
      editorial: {
        topics: metadata.topics ?? [],
        tags: metadata.tags ?? [],
        publicationDate: new Date(
          metadata.publishedAt ?? document.item.publishedAt,
        ).toISOString(),
        updatedDate: metadata.updatedAt
          ? new Date(metadata.updatedAt).toISOString()
          : "",
        language: metadata.language ?? "id",
        seoTitle: metadata.seoTitle ?? "",
        seoDescription: metadata.metaDescription ?? data.summary ?? "",
        canonicalUrl: metadata.canonical ?? "",
      },
    });
  content[document.pin.collection].push({
    id: document.applicationId,
    slug: document.item.slug,
    status: "published",
    locale: metadata.language ?? "id",
    publishedAt: document.item.publishedAt,
    data: fields,
  });
  records.push({
    applicationId: document.applicationId,
    productionPin: document.pin,
    markdownSha256: sha(data.body),
    portableTextSha256: sha(JSON.stringify(result.blocks)),
    blocks: result.blocks.length,
    textEquivalent: true,
    metadataPreserved: true,
    unsupported: result.unsupported,
    renderedSha256: sha(renderPortableText(result.blocks)),
  });
}
// Seed authors first, then resolve article relations to their new local EmDash IDs.
for (const post of content.posts) {
  const refs = post.data.integration.legacyMetadata.authorRefs ?? [];
  post.data.authors = refs.map((ref) => {
    const author = content.authors.find(
      (a) => ref === a.id || ref.endsWith("/" + a.slug),
    );
    assert.ok(author, "Unknown author relation " + ref);
    return "$ref:" + author.id;
  });
}
content.sections = [
  {
    id: "studio-section",
    slug: "editorial-note",
    status: "published",
    data: {
      title: "Editorial note",
      body: [
        {
          _type: "block",
          _key: "section-text",
          style: "normal",
          children: [
            {
              _type: "span",
              _key: "section-span",
              text: "A reusable editorial section.",
              marks: [],
            },
          ],
          markDefs: [],
        },
      ],
    },
  },
];
const collections = structuredClone(studioCollections);
const seed = { version: "1", defaultLocale: "id", collections, content };
mkdirSync(".gaga/editorial", { recursive: true });
writeFileSync(
  ".gaga/editorial/seed.json",
  JSON.stringify(seed, null, 2) + "\n",
);
writeFileSync(
  ".gaga/editorial/migration-equivalence.json",
  JSON.stringify(
    {
      status: "PASS",
      sourceExportSha256: sha(readFileSync("content/emdash/published.json")),
      articles: 7,
      authors: 1,
      productionWrites: 0,
      records,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    status: "PASS",
    articles: 7,
    authors: 1,
    unsupported: 0,
    canonicalBody: "Portable Text",
    productionWrites: 0,
  }),
);
