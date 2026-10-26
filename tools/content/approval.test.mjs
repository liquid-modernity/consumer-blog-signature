import test from "node:test";
import assert from "node:assert/strict";
import {
  signedContentMessage,
  verifiedContentMessage,
  nativePublishGate,
  contentApprovalRoutes,
} from "../../cms/editorial/content-approval.mjs";
const secret = "local-only-fixture-key-01234567890123456789",
  policy = "sha256:" + "a".repeat(64),
  request = {
    schema: "gaga.content-request/v1",
    action: "publish",
    resource: "posts/native-one",
    selectedRevision: "draft-exact",
    expectedPublishedRevision: "live-exact",
  };
function fixture() {
  const store = new Map();
  let version = 0,
    writes = 0;
  const item = {
    id: "native-one",
    type: "posts",
    status: "published",
    liveRevisionId: "live-exact",
    draftRevisionId: "draft-exact",
  };
  const kv = {
    get: async (k) => store.get(k)?.value ?? null,
    getVersioned: async (k) => store.get(k) ?? null,
    compareAndSet: async (k, r, v) => {
      if ((store.get(k)?.revision ?? null) !== r) return { applied: false };
      const revision = String(++version);
      store.set(k, { revision, value: v });
      return { applied: true, revision };
    },
    compareAndDelete: async (k, r) => {
      if (store.get(k)?.revision !== r) return { applied: false };
      store.delete(k);
      return { applied: true };
    },
  };
  const ctx = {
    kv,
    settings: {
      get: async (k) =>
        k === "contentReleaseKey"
          ? secret
          : k === "contentReleasePolicyDigest"
            ? policy
            : null,
    },
    content: {
      getVersioned: async () => ({ item, _rev: "native-cas" }),
      publish: async (_c, _i, opts) => {
        assert.equal(opts._rev, "native-cas");
        assert.equal(
          await nativePublishGate(
            {
              collection: "posts",
              content: item,
              origin: { source: "plugin", pluginId: "pakrpp-studio" },
            },
            ctx,
          ),
          undefined,
        );
        writes++;
        item.liveRevisionId = "draft-exact";
        item.draftRevisionId = null;
        return { item, _rev: "next-cas" };
      },
    },
  };
  return { ctx, item, store, writes: () => writes };
}
function payload(extra = {}) {
  return {
    schema: "gaga.content-message/v1",
    purpose: "apply-qualified-content",
    request,
    nonce: "intent-12345678",
    actorId: "editor",
    policyDigest: policy,
    planDigest: "sha256:" + "b".repeat(64),
    expiresAt: Date.now() + 120000,
    ...extra,
  };
}
test("native Publish cannot bypass the content pipeline, including forged origin without approval", async () => {
  const f = fixture();
  for (const origin of [
    { source: "api" },
    { source: "scheduler" },
    { source: "plugin", pluginId: "pakrpp-studio" },
  ])
    assert.equal(
      (
        await nativePublishGate(
          { collection: "posts", content: f.item, origin },
          f.ctx,
        )
      ).cancel,
      true,
    );
  assert.equal(f.writes(), 0);
});
test("missing, altered, expired and wrong-policy apply messages are denied before CMS mutation", async () => {
  for (const mode of ["missing", "tamper", "expired", "policy"]) {
    const f = fixture(),
      routes = contentApprovalRoutes();
    let message = await signedContentMessage(
      payload(
        mode === "expired"
          ? { expiresAt: Date.now() - 1 }
          : mode === "policy"
            ? { policyDigest: "wrong" }
            : {},
      ),
      secret,
    );
    if (mode === "missing") message = {};
    if (mode === "tamper")
      message.payload.request = { ...request, selectedRevision: "tampered" };
    f.ctx.input = message;
    assert.equal(
      (await routes["content-apply"].handler(f.ctx)).status,
      "DENIED",
    );
    assert.equal(f.writes(), 0);
  }
});
test("a valid host signature cannot invent an editorial consent nonce", async () => {
  const f = fixture();
  f.ctx.input = await signedContentMessage(payload(), secret);
  assert.equal(
    (await contentApprovalRoutes()["content-apply"].handler(f.ctx)).status,
    "DENIED",
  );
  assert.equal(f.writes(), 0);
});
test("one approved exact native intent uses CAS once, preserves history and rejects replay", async () => {
  const f = fixture(),
    p = payload();
  await f.ctx.kv.compareAndSet("content-intent:" + p.nonce, null, {
    request,
    actorId: "editor",
    expiresAt: p.expiresAt,
    state: "PUBLISH PENDING",
  });
  f.ctx.input = await signedContentMessage(p, secret);
  const route = contentApprovalRoutes()["content-apply"];
  assert.equal(
    (await route.handler(f.ctx)).status,
    "CMS_PUBLISHED_SITE_PENDING",
  );
  assert.equal(f.writes(), 1);
  assert.equal(f.item.liveRevisionId, "draft-exact");
  assert.equal((await route.handler(f.ctx)).status, "DENIED");
  assert.equal(f.writes(), 1);
});
test("editorial Live confirmation requires signed readback seal and an applied transition", async () => {
  const f = fixture(),
    p = payload();
  await f.ctx.kv.compareAndSet("content-intent:" + p.nonce, null, {
    request,
    actorId: "editor",
    expiresAt: p.expiresAt,
    state: "PUBLISH PENDING",
  });
  const routes = contentApprovalRoutes(),
    result = {
      ...p,
      purpose: "record-release-result",
      status: "PUBLISHED",
      releaseSealDigest: "sha256:" + "c".repeat(64),
    };
  f.ctx.input = await signedContentMessage(result, secret);
  assert.equal(
    (await routes["content-result"].handler(f.ctx)).status,
    "DENIED",
  );
  f.ctx.input = await signedContentMessage(p, secret);
  await routes["content-apply"].handler(f.ctx);
  f.ctx.input = await signedContentMessage(result, secret);
  assert.equal(
    (await routes["content-result"].handler(f.ctx)).status,
    "RECORDED",
  );
  assert.equal(
    (await f.ctx.kv.get("content-intent:" + p.nonce)).editorialStatus,
    "PUBLISHED",
  );
});
test("signed messages never grant anonymous draft reads or expose keys in outcomes", async () => {
  const f = fixture();
  f.ctx.input = { payload: {}, signature: "0".repeat(64) };
  const r = await contentApprovalRoutes()["content-apply"].handler(f.ctx);
  assert.ok(!JSON.stringify(r).includes(secret));
  await assert.rejects(verifiedContentMessage({}, secret, policy));
  assert.equal(f.writes(), 0);
});
test("signed editorial intent cannot be replayed as qualified apply approval", async () => {
  const f = fixture(),
    p = payload({ purpose: "editorial-intent" });
  await f.ctx.kv.compareAndSet("content-intent:" + p.nonce, null, {
    request,
    actorId: "editor",
    expiresAt: p.expiresAt,
    state: "PUBLISH PENDING",
  });
  f.ctx.input = await signedContentMessage(p, secret);
  assert.equal(
    (await contentApprovalRoutes()["content-apply"].handler(f.ctx)).status,
    "DENIED",
  );
  assert.equal(f.writes(), 0);
});

test("future due-time intent is denied even with signed host approval and editor consent", async () => {
  const f = fixture(),
    p = payload({ request: { ...request, notBefore: "2999-01-01T00:00:00Z" } });
  await f.ctx.kv.compareAndSet("content-intent:" + p.nonce, null, {
    request: p.request,
    actorId: p.actorId,
    expiresAt: p.expiresAt,
  });
  f.ctx.input = await signedContentMessage(p, secret);
  assert.equal(
    (await contentApprovalRoutes()["content-apply"].handler(f.ctx)).status,
    "DENIED",
  );
  assert.equal(f.writes(), 0);
});

test("baseline service denies anonymous requests without exposing private state", async () => {
  const f = fixture();
  f.ctx.input = {};
  assert.equal(
    (await contentApprovalRoutes()["content-baseline"].handler(f.ctx)).status,
    "DENIED",
  );
  assert.equal(f.writes(), 0);
});

test("verified baseline advancement uses CAS and an old Live callback cannot rewind it", async () => {
  const f = fixture(),
    p = payload(),
    bootstrap = "sha256:" + "d".repeat(64),
    source = "a".repeat(40),
    old = f.ctx.settings.get;
  f.ctx.settings.get = async (k) =>
    k === "contentReleaseBootstrapDigest"
      ? bootstrap
      : k === "contentReleaseSource"
        ? source
        : old(k);
  await f.ctx.kv.compareAndSet("content-intent:" + p.nonce, null, {
    request,
    actorId: "editor",
    state: "CMS_PUBLISHED_SITE_PENDING",
  });
  const nextBaseline = {
    schema: "gaga.release/v1",
    release: { class: "content" },
    source: { commit: source },
    target: { origin: "https://consumer-blog-signature.ratriatra.workers.dev" },
    content: {
      origin: "https://consumer-blog-signature-cms.ratriatra.workers.dev",
    },
  };
  const message = await signedContentMessage(
    {
      ...p,
      purpose: "record-release-result",
      status: "PUBLISHED",
      releaseSealDigest: policy,
      previousBaselineDigest: bootstrap,
      nextBaseline,
    },
    secret,
  );
  const route = contentApprovalRoutes()["content-result"];
  f.ctx.input = message;
  assert.equal((await route.handler(f.ctx)).status, "RECORDED");
  const saved = await f.ctx.kv.get("content-current-release");
  assert.equal((await route.handler(f.ctx)).status, "DENIED");
  assert.deepEqual(await f.ctx.kv.get("content-current-release"), saved);
  assert.equal(f.writes(), 0);
});
