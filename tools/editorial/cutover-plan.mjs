import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { markdownToPortableText } from "../../editorial/markdown.mjs";
import { plainText } from "../../editorial/portable-text.mjs";
import { studioCollections, pluginId } from "../../editorial/registry.mjs";
import { unified } from "unified";
import remarkParse from "remark-parse";
export const canonical = (x) =>
  JSON.stringify(x, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
export const digest = (x) =>
  createHash("sha256")
    .update(typeof x === "string" || Buffer.isBuffer(x) ? x : canonical(x))
    .digest("hex");
const root = resolve(import.meta.dirname, "../..");
export function buildCutoverPlan(
  source = JSON.parse(
    readFileSync(resolve(root, "cms/editorial/source-set.json")),
  ),
) {
  assert.equal(source.schema, "consumer.rich-migration-source/v1");
  assert.equal(source.records.length, 8);
  assert.equal(
    source.records.filter((r) => r.pin.collection === "posts").length,
    7,
  );
  assert.equal(
    source.records.filter((r) => r.pin.collection === "authors").length,
    1,
  );
  assert.equal(new Set(source.records.map((r) => r.pin.id)).size, 8);
  const widget = pluginId + ":integration",
    bodyWidget = pluginId + ":body";
  const operations = [];
  for (const collection of ["authors", "posts"]) {
    for (const field of [
      {
        slug: "content",
        label: collection === "authors" ? "Profile" : "Main Content",
        type: "portableText",
        widget: bodyWidget,
      },
      ...(collection === "posts"
        ? [
            {
              slug: "authors",
              label: "Authors",
              type: "reference",
              validation: { targetCollection: "authors", multiple: true },
            },
            {
              slug: "editorial",
              label: "Editorial settings",
              type: "json",
              widget: pluginId + ":metadata",
            },
          ]
        : []),
      {
        slug: "integration",
        label: "Integration identity",
        type: "json",
        widget,
      },
    ])
      operations.push({
        method: "POST",
        path: `schema/collections/${collection}/fields`,
        body: field,
      });
    for (const [slug, label] of [
      ["body", "Markdown migration archive"],
      ["metadata", "Legacy metadata archive"],
      ["application_id", "Application identity — managed"],
    ])
      operations.push({
        method: "PUT",
        path: `schema/collections/${collection}/fields/${slug}`,
        body: { label, widget },
      });
  }
  for (const collection of studioCollections.filter((c) =>
    ["pages", "references", "sections"].includes(c.slug),
  )) {
    const { fields, ...definition } = collection;
    operations.push({
      method: "POST",
      path: "schema/collections",
      body: definition,
    });
    for (const field of fields)
      operations.push({
        method: "POST",
        path: `schema/collections/${collection.slug}/fields`,
        body: field,
      });
  }
  const sourceSetSha256 = digest(source),
    records = source.records.map((r) => {
      assert.equal(r.bodySha256, digest(r.item.data.body));
      assert.equal(r.item.status, "published");
      assert.equal(r.item.draftRevisionId, null);
      const converted = markdownToPortableText(r.item.data.body);
      assert.equal(converted.ok, true, JSON.stringify(converted.unsupported));
      const text = (n) =>
        ["text", "inlineCode", "code"].includes(n.type)
          ? n.value
          : (n.children ?? [])
              .map(text)
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
      const normalize = (x) => x.replace(/\s+/gu, " ").trim();
      assert.equal(
        normalize(plainText(converted.blocks)),
        normalize(text(unified().use(remarkParse).parse(r.item.data.body))),
        "Text loss " + r.applicationId,
      );
      const m = r.item.data.metadata,
        record = {
          applicationId: r.applicationId,
          collection: r.pin.collection,
          contentId: r.pin.id,
          before: r.item,
          pin: r.pin,
          previousReviewedPin: r.previousReviewedPin,
          markdownSha256: r.bodySha256,
          portableTextSha256: digest(JSON.stringify(converted.blocks)),
          data: {
            content: converted.blocks,
            integration: {
              applicationId: r.applicationId,
              editorialSchema: "pakrpp.editorial/v1",
              canonicalBodyField: "content",
              legacyMetadata: m,
              migratedFrom: {
                pin: r.pin,
                previousReviewedPin: r.previousReviewedPin,
                markdownSha256: r.bodySha256,
                sourceSetSha256,
              },
            },
          },
          textEquivalent: true,
        };
      if (r.pin.collection === "posts") {
        record.data.editorial = {
          topics: m.topics ?? [],
          tags: m.tags ?? [],
          publicationDate: new Date(
            m.publishedAt ?? r.item.publishedAt,
          ).toISOString(),
          updatedDate: m.updatedAt ? new Date(m.updatedAt).toISOString() : "",
          language: m.language ?? "id",
          seoTitle: m.seoTitle ?? "",
          seoDescription: m.metaDescription ?? r.item.data.summary ?? "",
          canonicalUrl: m.canonical ?? "",
        };
        record.references = {
          authors: (m.authorRefs ?? []).map((ref) => {
            const author = source.records.find(
              (a) =>
                a.pin.collection === "authors" &&
                (a.applicationId === ref || ref.endsWith("/" + a.item.slug)),
            );
            assert.ok(author, "Unresolved author " + ref);
            return author.pin.id;
          }),
        };
      }
      return record;
    });
  return {
    schema: "consumer.rich-production-cutover/v1",
    origin: source.origin,
    sourceSetSha256,
    reviewedImplementation: "fded72b8f126c1f740583efa84d5dca3bbb7104b",
    reviewQualification: 40195752139,
    expectedMain: "6827195c5d2e04efe26656ae4372d449481d2979",
    rollback: {
      cmsWorker: "0bf4b66d-23bb-435f-8b14-0b2d7e64fd13",
      publicationWorker: "af6c1291-c509-4095-b7c1-a77c9007a390",
      d1: "b26b0e8a-e193-4a7d-8e1d-c553de22fd27",
      r2: "consumer-blog-signature-cms-media",
      kv: "a0ad6f282a314e17bbdfec6c4e0c9fa2",
      requiresPreMutationRecoverableBackup: true,
      requiresJournalAndNoNewOperatorEdits: true,
    },
    schemaOperations: operations,
    records,
    writeBudget: operations.length + records.length * 2,
    authorization:
      "Operator explicitly authorized current-production readmission and additive Rich Studio migration only after fresh qualification. No main promotion or publication Worker deployment.",
    productionContentCreates: 0,
    retries: 0,
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const plan = buildCutoverPlan(),
    out =
      process.env.GAGA_EVIDENCE_DIRECTORY ?? resolve(root, ".gaga/editorial");
  mkdirSync(out, { recursive: true });
  const bytes = JSON.stringify(plan, null, 2) + "\n";
  writeFileSync(resolve(root, "cms/editorial/migration-plan.json"), bytes);
  writeFileSync(
    resolve(out, "cutover-plan-receipt.json"),
    JSON.stringify(
      {
        status: "PASS",
        sourceSetSha256: plan.sourceSetSha256,
        planSha256: digest(bytes),
        records: 8,
        schemaOperations: plan.schemaOperations.length,
        writeBudget: plan.writeBudget,
        productionWrites: 0,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      status: "PASS",
      planSha256: digest(bytes),
      sourceSetSha256: plan.sourceSetSha256,
      records: 8,
    }),
  );
}
