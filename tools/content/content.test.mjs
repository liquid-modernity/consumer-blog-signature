import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  qualifyEditorial,
  previewDocument,
} from "../../editorial/content-release.mjs";
import { contentReleaseRoutes } from "../../cms/editorial/content-release.mjs";
import { projectPublished } from "./adapter.mjs";
import { changedSurfaces } from "./build.mjs";
const profile = JSON.parse(readFileSync("content-release.json")),
  snapshot = JSON.parse(readFileSync("content/emdash/published.json")),
  d = snapshot.documents.find((d) => d.item.type === "posts");
const selected = {
  published: structuredClone(d.item),
  revision: {
    id: "exact-draft",
    collection: "posts",
    entryId: d.item.id,
    data: structuredClone(d.item.data),
  },
};
const request = {
  schema: "gaga.content-request/v1",
  action: "publish",
  resource: "posts/" + d.item.id,
  selectedRevision: "exact-draft",
  expectedPublishedRevision: d.item.liveRevisionId,
};
function ctx() {
  const item = {
    ...structuredClone(selected.published),
    draftRevisionId: "exact-draft",
  };
  return {
    user: { id: "editor" },
    input: request,
    content: {
      getVersioned: async () => ({ item, _rev: "opaque-native-cas" }),
      getRevision: async () => selected.revision,
      list: async (collection) => ({
        items: snapshot.documents
          .filter((d) => d.item.type === collection)
          .map((d) => d.item),
        hasMore: false,
      }),
    },
  };
}
test("content qualifies against the existing canonical renderer and protected preview has no scripts", () => {
  const r = qualifyEditorial({ request, selected, profile, snapshot }),
    html = previewDocument(r);
  assert.ok(r.affected.current.includes("/search-index.json"));
  assert.ok(r.affected.current.includes("/rss.xml"));
  assert.ok(html.includes("script-src"));
  assert.ok(!html.includes("<script"));
  assert.throws(() => previewDocument(r, ["javascript:alert(1)"]));
});
test("unknown blocks and duplicate routes fail closed", () => {
  const s = structuredClone(selected);
  s.revision.data.content = [{ _type: "rawHtml", html: "unsafe" }];
  assert.throws(() =>
    qualifyEditorial({ request, selected: s, profile, snapshot }),
  );
  s.revision.data = structuredClone(selected.revision.data);
  s.revision.data._slug = snapshot.documents.find(
    (x) => x.item.type === "posts" && x.item.id !== d.item.id,
  ).item.slug;
  assert.throws(() =>
    qualifyEditorial({ request, selected: s, profile, snapshot }),
  );
});
test("artifact diff includes changed Search, pages, added and removed routes while excluding unchanged output", () => {
  const r = changedSurfaces(
    [
      { path: "dist/a/index.html", digest: "one" },
      { path: "dist/search-index.json", digest: "old" },
      { path: "dist/stable.css", digest: "same" },
    ],
    [
      { path: "dist/b/index.html", digest: "two" },
      { path: "dist/search-index.json", digest: "new" },
      { path: "dist/stable.css", digest: "same" },
    ],
  );
  assert.deepEqual(r.removed, ["/a/"]);
  assert.deepEqual(r.proposed, ["/b/", "/search-index.json"]);
  assert.ok(!r.current.includes("/stable.css"));
});
test("unpublish removes projection, not CMS data/history; export strips private CMS bookkeeping", () => {
  const original = JSON.stringify(snapshot),
    next = projectPublished(
      snapshot,
      { ...request, action: "unpublish" },
      d.item,
    );
  assert.equal(next.documents.length, 7);
  assert.equal(JSON.stringify(snapshot), original);
  const publicItem = {
    ...d.item,
    authorId: "PRIVATE_ACCOUNT",
    _rev: "PRIVATE_REV",
  };
  const out = projectPublished(snapshot, request, publicItem);
  assert.ok(!JSON.stringify(out).includes("PRIVATE_"));
});
test("native preview denies unbound callers and selects only the exact saved revision", async () => {
  const routes = contentReleaseRoutes();
  assert.equal(routes["content-preview"].public, false);
  assert.equal(routes["content-preview"].permission, "content:publish_any");
  const c = ctx(),
    r = await routes["content-preview"].handler(c);
  assert.equal(r.status, "PREVIEW READY");
  assert.equal(r.selectedRevision, "exact-draft");
  c.user = null;
  assert.equal(
    (await routes["content-preview"].handler(c)).status,
    "PREVIEW UNAVAILABLE",
  );
});
test("Publish preserves drafts and fails closed until dispatch is provisioned", async () => {
  const c = ctx(),
    before = JSON.stringify(selected),
    r = await contentReleaseRoutes()["content-publish"].handler(c);
  assert.equal(r.status, "PUBLISHING UNAVAILABLE");
  assert.equal(JSON.stringify(selected), before);
  assert.ok(!/Git|CI|artifact|manifest|digest|Worker/.test(r.message));
});
test("publish intent is sent only after exact selection, and conflicting selections make zero dispatches", async () => {
  let calls = 0;
  const routes = contentReleaseRoutes({
      dispatch: async (x) => {
        calls++;
        assert.equal(x.request.selectedRevision, "exact-draft");
      },
    }),
    c = ctx();
  assert.equal(
    (await routes["content-publish"].handler(c)).status,
    "PUBLISH PENDING",
  );
  assert.equal(calls, 1);
  c.input = { ...request, selectedRevision: "stale-draft" };
  assert.equal(
    (await routes["content-publish"].handler(c)).status,
    "PUBLISH FAILED",
  );
  assert.equal(calls, 1);
});
