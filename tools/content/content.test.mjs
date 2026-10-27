import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  qualifyEditorial,
  previewDocument,
} from "../../editorial/content-release.mjs";
import { contentReleaseRoutes } from "../../cms/editorial/content-release.mjs";
import { projectPublished, projectPreview } from "./adapter.mjs";
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
  const values = new Map();
  let version = 0;
  const kv = {
    get: async (key) => values.get(key)?.value ?? null,
    getVersioned: async (key) => values.get(key) ?? null,
    compareAndSet: async (key, revision, value) => {
      if ((values.get(key)?.revision ?? null) !== revision)
        return { applied: false };
      const next = { value, revision: String(++version) };
      values.set(key, next);
      return { applied: true, revision: next.revision };
    },
    compareAndDelete: async (key, revision) => {
      if (values.get(key)?.revision !== revision) return { applied: false };
      values.delete(key);
      return { applied: true };
    },
  };

  const item = {
    ...structuredClone(selected.published),
    draftRevisionId: "exact-draft",
  };
  return {
    user: { id: "editor" },
    authorization: { check: async () => ({ allowed: true }) },
    kv,
    input: request,
    content: {
      getVersioned: async () => ({ item, _rev: "opaque-native-cas" }),
      getRevision: async () => selected.revision,
      list: async (collection,options) => {
        assert.deepEqual(options,{where:{status:'published'},limit:100});
        return ({
        items: snapshot.documents
          .filter((d) => d.item.type === collection)
          .map((d) => d.item),
        hasMore: false,
      });},
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
  assert.equal(routes["content-preview"].permission, "content:publish_own");
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
        assert.notEqual(x.actor.id, "editor");
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

test("private preview uses the exact draft instead of the provider published overlay", () => {
  const s = structuredClone(selected);
  s.published.liveData = structuredClone(s.published.data);
  s.revision.data.summary = "Private prospective summary";
  const out = projectPreview(snapshot, request, s, d.item.slug);
  const record = out.documents.find((x) => x.item.id === d.item.id);
  assert.equal(record.item.data.summary, "Private prospective summary");
  assert.equal(record.item.liveRevisionId, "exact-draft");
  assert.equal(out.provenance.liveEmDashExportVerified, false);
  assert.equal(out.provenance.prospective, true);
  assert.equal(out.mode, "prospective-content-preview");
  assert.notEqual(s.published.liveData.summary, record.item.data.summary);
});

test("configured server dispatch authenticates the exact request without exposing account IDs or credentials", async () => {
  const c = ctx(),
    secret = "isolated-dispatch-key-01234567890123456789",
    policy = "sha256:" + "a".repeat(64),
    token = "isolated-dispatch-fixture";
  const values = {
    contentReleaseEnabled: true,
    contentReleaseKey: secret,
    contentReleasePolicyDigest: policy,
    contentReleaseDispatchToken: token,
    contentReleaseWorkflowId: "123",
    contentReleaseSource: "b".repeat(40),
    contentReleaseBootstrapDigest: policy,
  };
  c.settings = { get: async (k) => values[k] };
  let sent = 0;
  c.http = {
    fetch: async (url, o) => {
      sent++;
      assert.equal(
        url,
        "https://api.github.com/repos/liquid-modernity/consumer-blog-signature/actions/workflows/123/dispatches",
      );
      assert.equal(o.headers.Authorization, "Bearer " + token);
      const body = JSON.parse(o.body);
      assert.equal(body.ref, "main");
      const signed = JSON.parse(body.inputs.intent);
      const { verifiedContentMessage } =
        await import("../../cms/editorial/content-approval.mjs");
      const p = await verifiedContentMessage(
        signed,
        secret,
        policy,
        "editorial-intent",
      );
      assert.deepEqual(p.request, request);
      assert.match(p.requestDigest, /^sha256:[a-f0-9]{64}$/);
      assert.notEqual(p.actorId, c.user.id);
      assert.equal(p.applicationCommit, values.contentReleaseSource);
      return new Response(null, { status: 204 });
    },
  };
  values.contentReleaseEnabled = false;
  assert.equal(
    (await contentReleaseRoutes()["content-publish"].handler(c)).status,
    "PUBLISHING UNAVAILABLE",
  );
  assert.equal(sent, 0);
  values.contentReleaseEnabled = true;
  const routes = contentReleaseRoutes(),
    r = await routes["content-publish"].handler(c);
  assert.equal(r.status, "PUBLISH PENDING");
  assert.equal(sent, 1);
  assert.ok(
    !JSON.stringify(r).includes(secret) && !JSON.stringify(r).includes(token),
  );
  c.input = { nonce: r.nonce };
  assert.equal(
    (await routes["content-status"].handler(c)).status,
    "PUBLISH PENDING",
  );
  c.user = { id: "other-user" };
  assert.equal((await routes["content-status"].handler(c)).status, "DENIED");
});

test('preview rejects a revision response with the wrong exact identity or record owner',async()=>{
 for(const changed of [{id:'another-revision'},{entryId:'another-entry'},{collection:'authors'}]){
  const c=ctx();c.content.getRevision=async()=>({...selected.revision,...changed});
  assert.equal((await contentReleaseRoutes()['content-preview'].handler(c)).status,'PREVIEW UNAVAILABLE');
 }
});
