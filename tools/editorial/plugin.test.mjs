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
