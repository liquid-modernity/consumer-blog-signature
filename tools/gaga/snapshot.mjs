import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { parse } from "yaml";
import { readEmDashPublished } from "@gaga/corps-emdash";
import { editorialBody } from "../../editorial/portable-text.mjs";
import { withEditorialText } from "../../editorial/search.mjs";
export const root = resolve(import.meta.dirname, "../..");
export const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export function frontmatter(text) {
  const m = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert.ok(m, "Frontmatter required");
  return parse(m[1], { uniqueKeys: true });
}
export function readSnapshot() {
  return JSON.parse(
    readFileSync(resolve(root, "content/emdash/published.json"), "utf8"),
  );
}
export function cmsFrontmatter(document) {
  const {
    title,
    summary,
    metadata,
    integration,
    editorial,
    body,
    content,
    application_id,
    ...fields
  } = document.item.data;
  const legacy = metadata ?? integration?.legacyMetadata ?? {};
  const publishedAt = editorial?.publicationDate ?? fields.publishedAt ?? legacy.publishedAt ?? fields.date ?? legacy.date ?? legacy.pubDate;
  const updatedAt = editorial?.updatedDate ?? fields.updatedAt ?? legacy.updatedAt ?? fields.updatedDate ?? legacy.updatedDate ?? legacy.updated;
  return {
    ...legacy,
    ...fields,
    ...(editorial
      ? {
          topics: editorial.topics,
          tags: editorial.tags,
          publishedAt: editorial.publicationDate,
          updatedAt: editorial.updatedDate,
          language: editorial.language,
          seoTitle: editorial.seoTitle,
          metaDescription: editorial.seoDescription,
          canonical: editorial.canonicalUrl,
          image: editorial.featuredImage?.url,
          imageAlt: editorial.featuredImage?.alt,
        }
      : {}),
    // Engine's public metadata input uses date aliases; native revision pins stay separate.
    date: publishedAt,
    pubDate: publishedAt,
    publishedAt,
    updatedDate: updatedAt,
    updatedAt,
    title,
    summary,
    contentId: metadata?.contentId ?? integration?.applicationId,
  };
}
export async function verifySnapshot(snapshot = readSnapshot()) {
  const preview = process.env.GAGA_CONTENT_PREVIEW_QUALIFICATION === "1";
  assert.equal(snapshot.schema, "consumer.emdash-export/v1");
  assert.equal(
    snapshot.mode,
    preview ? "prospective-content-preview" : "published-emdash-export",
  );
  const receipt = JSON.parse(
    readFileSync(resolve(root, "content/emdash/published-receipt.json")),
  );
  assert.equal(receipt.status, "PASS");
  assert.equal(
    receipt.classification,
    preview ? "PROSPECTIVE_CONTENT_PREVIEW" : "REAL_EMDASH_API_EXPORT",
  );
  assert.equal(
    receipt.exportSha256,
    sha256(JSON.stringify(snapshot, null, 2) + "\n"),
    "Export differs from admitted provider receipt",
  );
  assert.equal(snapshot.provenance.emdashVersion, "1.3.1");
  assert.equal(snapshot.provenance.liveEmDashExportVerified, !preview);
  if (preview) assert.equal(snapshot.provenance.prospective, true);
  else assert.notEqual(snapshot.provenance.prospective, true);
  const migration = JSON.parse(
      readFileSync(resolve(root, "cms/migration/source-map.json")),
    ),
    seen = new Set(),
    artifacts = [];
  assert.ok(
    snapshot.documents.length <= migration.length,
    "New content needs explicit route admission",
  );
  for (const mapping of migration)
    assert.equal(
      sha256(readFileSync(resolve(root, mapping.originalPath))),
      mapping.sourceSha256,
      "Migration source remains immutable",
    );
  for (const document of snapshot.documents) {
    const mapping = migration.find(
      (x) => x.applicationId === document.applicationId,
    );
    assert.ok(mapping && !seen.has(document.path));
    seen.add(document.path);
    assert.equal(document.path, mapping.originalPath);
    assert.equal(
      sha256(readFileSync(resolve(root, document.path))),
      mapping.sourceSha256,
      "Migration source is read-only; edit EmDash instead",
    );
    assert.equal(document.item.data.application_id, document.applicationId);
    assert.equal(document.item.data.metadata.contentId, document.applicationId);
    assert.equal(
      sha256(
        typeof editorialBody(document.item.data) === "string"
          ? editorialBody(document.item.data)
          : JSON.stringify(editorialBody(document.item.data)),
      ),
      document.bodySha256,
      "CMS export body changed",
    );
    assert.equal(document.pin.origin, snapshot.origin);
    assert.ok(
      !document.pin.id.startsWith("seed-") &&
        !document.pin.liveRevisionId.startsWith("migration-"),
    );
    const projection = await readEmDashPublished(document.pin, {
      origin: snapshot.origin,
      authorizeRead: async (resource) => ({ decision: "ALLOW", resource }),
      readRaw: async () => structuredClone(document.item),
    });
    assert.equal(
      projection.status,
      "projected",
      "Recorded CMS export rejected: " + projection.code,
    );
    artifacts.push(
      Array.isArray(editorialBody(document.item.data))
        ? withEditorialText(projection, editorialBody(document.item.data))
        : projection.artifact,
    );
  }
  // Original editorial files are immutable migration evidence, never a second writable authority.
  function visit(dir) {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, f.name);
      if (f.isDirectory()) visit(path);
      else if (f.name.endsWith(".md")) {
        const d = frontmatter(readFileSync(path, "utf8"));
        if (
          ["article", "author"].includes(d.contentKind) &&
          d.status === "published" &&
          d.visibility === "public" &&
          !d.draft &&
          !d.noindex
        )
          assert.ok(
            migration.some((m) => m.originalPath === relative(root, path)),
            "Editorial content must enter through EmDash",
          );
      }
    }
  }
  visit(resolve(root, "src/content/docs"));
  return { snapshot, artifacts };
}
