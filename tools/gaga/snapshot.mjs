import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { parse } from "yaml";
import { readEmDashPublished } from "@gaga/corps-emdash";
export const root = resolve(import.meta.dirname, "../..");
export const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export function frontmatter(text) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert.ok(match, "Frontmatter required");
  return parse(match[1], { uniqueKeys: true });
}
export function readSnapshot() {
  return JSON.parse(
    readFileSync(resolve(root, "content/emdash/snapshot.json"), "utf8"),
  );
}
export async function verifySnapshot(snapshot = readSnapshot()) {
  assert.equal(snapshot.schema, "consumer.emdash-snapshot/v1");
  assert.equal(snapshot.mode, "pinned-migration-seed");
  const seen = new Set(),
    artifacts = [];
  for (const document of snapshot.documents) {
    assert.ok(!seen.has(document.path), "Duplicate CMS body");
    seen.add(document.path);
    assert.ok(
      /^src\/content\/docs\/[a-z0-9/_.-]+\.md$/.test(document.path) &&
        !document.path.split("/").includes(".."),
      "Only declared Markdown snapshot bodies",
    );
    const path = resolve(root, document.path);
    assert.ok(!relative(root, path).startsWith(".."));
    const bytes = readFileSync(path);
    assert.equal(
      sha256(bytes),
      document.bodySha256,
      "Snapshot body changed; obtain a reviewed CMS export",
    );
    const data = frontmatter(bytes.toString());
    assert.deepEqual(
      data,
      document.item.data,
      "CMS metadata/body disagreement",
    );
    const result = await readEmDashPublished(document.pin, {
      origin: snapshot.origin,
      authorizeRead: async (resource) => ({ decision: "ALLOW", resource }),
      readRaw: async (collection, id) => {
        assert.equal(collection, document.pin.collection);
        assert.equal(id, document.pin.id);
        return structuredClone(document.item);
      },
    });
    assert.equal(
      result.status,
      "projected",
      "Pinned CMS content rejected: " + result.code,
    );
    artifacts.push(result.artifact);
  }
  // New or modified editorial content must enter through the same admitted snapshot.
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
            seen.has(relative(root, path)),
            "Unadmitted editorial source",
          );
      }
    }
  }
  visit(resolve(root, "src/content/docs"));
  return { snapshot, artifacts };
}
