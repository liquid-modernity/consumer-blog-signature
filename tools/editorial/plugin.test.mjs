import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createPlugin } from "../../cms/editorial/plugin.mjs";
import { markdownToPortableText } from "../../editorial/markdown.mjs";
const save = createPlugin().hooks["content:beforeSave"].handler;
test("native save hook admits rich content and one canonical field, protects the Markdown archive", async () => {
  const body = "Original Markdown",
    content = markdownToPortableText(body).blocks;
  const integration = {
    canonicalBodyField: "content",
    migratedFrom: {
      markdownSha256: createHash("sha256").update(body).digest("hex"),
    },
  };
  assert.deepEqual(
    (
      await save({
        collection: "posts",
        content: { body, content, integration },
      })
    ).content,
    content,
  );
  await assert.rejects(() =>
    save({
      collection: "posts",
      content: { body: "Changed archive", content, integration },
    }),
  );
  await assert.rejects(() => save({ collection: "posts", content: { body } }));
  await assert.rejects(() =>
    save({
      collection: "posts",
      content: {
        body: [
          {
            _type: "htmlBlock",
            _key: "unsafe",
            html: "<script>bad()</script>",
          },
        ],
      },
    }),
  );
});
test("native human authoring receives managed identity without migration JSON", async () => {
  const body = markdownToPortableText("Human-authored content").blocks;
  const result = await save({
    collection: "pages",
    isNew: true,
    content: { title: "A Page", body, editorial: null },
  });
  assert.match(result.integration.applicationId, /^editorial-/);
  assert.equal(result.integration.canonicalBodyField, "body");
  assert.deepEqual(
    (await save({ collection: "authors", content: { body: null } })).body,
    [],
  );
  await assert.rejects(() =>
    save({ collection: "posts", content: { body, editorial: { tags: [{}] } } }),
  );
});

test("managed legacy constraints support new rich authoring through public schema discovery", async () => {
  const content = markdownToPortableText("New rich record").blocks;
  const ctx = {
    schema: {
      getCollection: async () => ({
        fields: ["content", "body", "metadata", "application_id"].map(
          (slug) => ({ slug }),
        ),
      }),
    },
  };
  const r = await save(
    {
      collection: "posts",
      isNew: true,
      content: { title: "New record", content },
    },
    ctx,
  );
  assert.equal(r.integration.canonicalBodyField, "content");
  assert.equal(r.application_id, r.integration.applicationId);
  assert.equal(r.body, "New rich record");
  assert.equal(
    r.integration.migratedFrom.sourceKind,
    "rich-creation-compatibility-snapshot",
  );
  assert.equal(
    r.integration.migratedFrom.markdownSha256,
    createHash("sha256").update(r.body).digest("hex"),
  );
});
